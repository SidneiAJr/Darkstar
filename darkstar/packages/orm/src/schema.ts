import { Blueprint, ColumnDefinition } from './blueprint'
import { BaseDriver } from './drivers/base-driver'

export class Schema {
  private driver: BaseDriver

  constructor(driver: BaseDriver) {
    this.driver = driver
  }

  // -----------------------------------------------
  // DDL
  // -----------------------------------------------

  async create(table: string, callback: (blueprint: Blueprint) => void): Promise<void> {
    const blueprint = new Blueprint()
    callback(blueprint)
    const sql = this._buildCreateSQL(table, blueprint)
    await this.driver.query(sql)
    await this._createTriggers(table, blueprint)
  }

  async drop(table: string): Promise<void> {
    // remove triggers antes de dropar a tabela
    await this._dropTriggers(table)
    await this.driver.query(`DROP TABLE IF EXISTS \`${table}\``)
  }

  async hasTable(table: string): Promise<boolean> {
    const db = this.driver.type()

    if (db === 'postgres') {
      const { rows } = await this.driver.query(
        `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
        [table]
      )
      return rows.length > 0
    }

    if (db === 'sqlite') {
      const { rows } = await this.driver.query(
        `SELECT 1 FROM sqlite_master WHERE type='table' AND name=?`,
        [table]
      )
      return rows.length > 0
    }

    // mysql / mariadb
    const { rows } = await this.driver.query(`SHOW TABLES LIKE ?`, [table])
    return rows.length > 0
  }

  async addColumn(table: string, callback: (blueprint: Blueprint) => void): Promise<void> {
    const blueprint = new Blueprint()
    callback(blueprint)
    for (const col of blueprint.columns) {
      const colSQL = this._buildColumnSQL(col)
      await this.driver.query(`ALTER TABLE \`${table}\` ADD COLUMN ${colSQL}`)
    }
    // recria triggers se adicionou updated_at
    const hasUpdatedAt = blueprint.columns.some(c => c.name === 'updated_at')
    if (hasUpdatedAt) {
      await this._dropTriggers(table)
      await this._createTriggers(table, blueprint)
    }
  }

  async dropColumn(table: string, column: string): Promise<void> {
    await this.driver.query(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\``)
  }

  async renameTable(from: string, to: string): Promise<void> {
    const db = this.driver.type()
    if (db === 'postgres') {
      await this.driver.query(`ALTER TABLE "${from}" RENAME TO "${to}"`)
    } else {
      await this.driver.query(`RENAME TABLE \`${from}\` TO \`${to}\``)
    }
  }

  async truncate(table: string): Promise<void> {
    await this.driver.query(`TRUNCATE TABLE \`${table}\``)
  }

  // -----------------------------------------------
  // Triggers
  // -----------------------------------------------

  private async _createTriggers(table: string, blueprint: Blueprint): Promise<void> {
    const db = this.driver.type()

    // SQLite e Postgres têm comportamento diferente — trigger só pra MySQL/MariaDB
    if (db !== 'mysql' && db !== 'mariadb') return

    const hasUpdatedAt = blueprint.columns.some(c => c.name === 'updated_at')
    const hasSoftDelete = blueprint.columns.some(c => c.name === 'deleted_at')

    // Trigger: atualiza updated_at em todo UPDATE
    if (hasUpdatedAt) {
      await this.driver.query(`DROP TRIGGER IF EXISTS \`trg_${table}_updated_at\``)
      await this.driver.query(`
        CREATE TRIGGER \`trg_${table}_updated_at\`
        BEFORE UPDATE ON \`${table}\`
        FOR EACH ROW
        BEGIN
          IF OLD.updated_at = NEW.updated_at OR NEW.updated_at IS NULL THEN
            SET NEW.updated_at = CURRENT_TIMESTAMP;
          END IF;
        END
      `)
    }

    // Trigger: registra deleted_at ao fazer soft delete (quando deleted_at era NULL)
    if (hasSoftDelete && hasUpdatedAt) {
      await this.driver.query(`DROP TRIGGER IF EXISTS \`trg_${table}_soft_delete\``)
      await this.driver.query(`
        CREATE TRIGGER \`trg_${table}_soft_delete\`
        BEFORE UPDATE ON \`${table}\`
        FOR EACH ROW
        BEGIN
          IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
            SET NEW.updated_at = CURRENT_TIMESTAMP;
          END IF;
        END
      `)
    }
  }

  private async _dropTriggers(table: string): Promise<void> {
    const db = this.driver.type()
    if (db !== 'mysql' && db !== 'mariadb') return

    await this.driver.query(`DROP TRIGGER IF EXISTS \`trg_${table}_updated_at\``)
    await this.driver.query(`DROP TRIGGER IF EXISTS \`trg_${table}_soft_delete\``)
  }

  // -----------------------------------------------
  // Build SQL
  // -----------------------------------------------

  private _buildCreateSQL(table: string, blueprint: Blueprint): string {
    const lines: string[] = []

    for (const col of blueprint.columns) {
      lines.push('  ' + this._buildColumnSQL(col))
    }

    // PRIMARY KEY
    const primaryCol = blueprint.columns.find(c => c.primary)
    if (primaryCol) {
      lines.push(`  PRIMARY KEY (\`${primaryCol.name}\`)`)
    }

    // UNIQUE KEYS
    const uniqueCols = blueprint.columns.filter(c => c.unique && !c.primary)
    for (const col of uniqueCols) {
      lines.push(`  UNIQUE KEY \`${table}_${col.name}_unique\` (\`${col.name}\`)`)
    }

    // FOREIGN KEYS — BUG CORRIGIDO: nome inclui tabela pra evitar duplicatas
    const foreignCols = blueprint.columns.filter(c => c.references)
    for (const col of foreignCols) {
      lines.push(
        `  CONSTRAINT \`fk_${table}_${col.name}\` FOREIGN KEY (\`${col.name}\`) ` +
        `REFERENCES \`${col.references!.table}\` (\`${col.references!.column}\`) ` +
        `ON DELETE RESTRICT ON UPDATE CASCADE`
      )
    }

    return [
      `CREATE TABLE IF NOT EXISTS \`${table}\` (`,
      lines.join(',\n'),
      `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
    ].join('\n')
  }

  private _buildColumnSQL(col: ColumnDefinition): string {
    const parts: string[] = []

    parts.push(`\`${col.name}\``)
    parts.push(this._buildType(col))

    if (col.unsigned) parts.push('UNSIGNED')

    if (col.nullable) {
      parts.push('NULL')
    } else {
      parts.push('NOT NULL')
    }

    if (col.default !== undefined) {
      if (
        col.default === 'CURRENT_TIMESTAMP' ||
        col.default === 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
      ) {
        parts.push(`DEFAULT ${col.default}`)
      } else if (typeof col.default === 'string') {
        parts.push(`DEFAULT '${col.default}'`)
      } else {
        parts.push(`DEFAULT ${col.default}`)
      }
    }

    if (col.autoIncrement) parts.push('AUTO_INCREMENT')

    return parts.join(' ')
  }

  private _buildType(col: ColumnDefinition): string {
    switch (col.type) {
      case 'VARCHAR':   return `VARCHAR(${col.length ?? 255})`
      case 'TINYINT':   return `TINYINT(${col.length ?? 1})`
      case 'INT':       return 'INT'
      case 'BIGINT':    return 'BIGINT'
      case 'FLOAT':     return `FLOAT(${col.precision ?? 8}, ${col.scale ?? 2})`
      case 'DECIMAL':   return `DECIMAL(${col.precision ?? 8}, ${col.scale ?? 2})`
      case 'TEXT':      return 'TEXT'
      case 'LONGTEXT':  return 'LONGTEXT'
      case 'DATE':      return 'DATE'
      case 'DATETIME':  return 'DATETIME'
      case 'TIMESTAMP': return 'TIMESTAMP'
      case 'JSON':      return 'JSON'
      case 'ENUM':      return `ENUM(${(col.values ?? []).map((v: string) => `'${v}'`).join(', ')})`
      default:          return col.type
    }
  }
}