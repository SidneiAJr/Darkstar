import { Blueprint, ColumnDefinition } from './blueprint'
import { BaseDriver } from './drivers/base-driver'

type DbType = 'mysql' | 'mariadb' | 'postgres' | 'sqlite'

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
    await this._dropTriggers(table)
    const db = this.driver.type()
    if (db === 'postgres') {
      await this.driver.query(`DROP TABLE IF EXISTS "${table}"`)
    } else if (db === 'sqlite') {
      await this.driver.query(`DROP TABLE IF EXISTS \`${table}\``)
    } else {
      await this.driver.query(`DROP TABLE IF EXISTS \`${table}\``)
    }
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
    const db = this.driver.type()

    for (const col of blueprint.columns) {
      const colSQL = this._buildColumnSQL(col, db)
      if (db === 'postgres') {
        await this.driver.query(`ALTER TABLE "${table}" ADD COLUMN ${colSQL}`)
      } else {
        await this.driver.query(`ALTER TABLE \`${table}\` ADD COLUMN ${colSQL}`)
      }
    }

    const hasUpdatedAt = blueprint.columns.some(c => c.name === 'updated_at')
    if (hasUpdatedAt) {
      await this._dropTriggers(table)
      await this._createTriggers(table, blueprint)
    }
  }

  async dropColumn(table: string, column: string): Promise<void> {
    const db = this.driver.type()
    if (db === 'postgres') {
      await this.driver.query(`ALTER TABLE "${table}" DROP COLUMN "${column}"`)
    } else {
      await this.driver.query(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\``)
    }
  }

  async renameTable(from: string, to: string): Promise<void> {
    const db = this.driver.type()
    if (db === 'postgres') {
      await this.driver.query(`ALTER TABLE "${from}" RENAME TO "${to}"`)
    } else if (db === 'sqlite') {
      await this.driver.query(`ALTER TABLE \`${from}\` RENAME TO \`${to}\``)
    } else {
      await this.driver.query(`RENAME TABLE \`${from}\` TO \`${to}\``)
    }
  }

  async truncate(table: string): Promise<void> {
    const db = this.driver.type()
    if (db === 'sqlite') {
      // SQLite não tem TRUNCATE — deleta tudo e reseta o autoincrement
      await this.driver.query(`DELETE FROM \`${table}\``)
      await this.driver.query(`DELETE FROM sqlite_sequence WHERE name=?`, [table])
    } else if (db === 'postgres') {
      await this.driver.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`)
    } else {
      await this.driver.query(`TRUNCATE TABLE \`${table}\``)
    }
  }

  // -----------------------------------------------
  // Triggers
  // -----------------------------------------------

  private async _createTriggers(table: string, blueprint: Blueprint): Promise<void> {
    const db = this.driver.type()
    const hasUpdatedAt  = blueprint.columns.some(c => c.name === 'updated_at')
    const hasSoftDelete = blueprint.columns.some(c => c.name === 'deleted_at')

    if (db === 'mysql' || db === 'mariadb') {
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

    if (db === 'postgres') {
      if (hasUpdatedAt) {
        // Cria a função uma vez só (OR REPLACE)
        await this.driver.query(`
          CREATE OR REPLACE FUNCTION trg_set_updated_at()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
        `)
        await this.driver.query(`DROP TRIGGER IF EXISTS trg_${table}_updated_at ON "${table}"`)
        await this.driver.query(`
          CREATE TRIGGER trg_${table}_updated_at
          BEFORE UPDATE ON "${table}"
          FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
        `)
      }
    }

    if (db === 'sqlite') {
      if (hasUpdatedAt) {
        await this.driver.query(`DROP TRIGGER IF EXISTS trg_${table}_updated_at`)
        await this.driver.query(`
          CREATE TRIGGER trg_${table}_updated_at
          AFTER UPDATE ON \`${table}\`
          FOR EACH ROW
          BEGIN
            UPDATE \`${table}\` SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
          END;
        `)
      }
    }
  }

  private async _dropTriggers(table: string): Promise<void> {
    const db = this.driver.type()

    if (db === 'mysql' || db === 'mariadb') {
      await this.driver.query(`DROP TRIGGER IF EXISTS \`trg_${table}_updated_at\``)
      await this.driver.query(`DROP TRIGGER IF EXISTS \`trg_${table}_soft_delete\``)
    }

    if (db === 'postgres') {
      await this.driver.query(`DROP TRIGGER IF EXISTS trg_${table}_updated_at ON "${table}"`)
    }

    if (db === 'sqlite') {
      await this.driver.query(`DROP TRIGGER IF EXISTS trg_${table}_updated_at`)
    }
  }

  // -----------------------------------------------
  // Build SQL
  // -----------------------------------------------

  private _buildCreateSQL(table: string, blueprint: Blueprint): string {
    const db = this.driver.type()

    if (db === 'postgres') return this._buildCreateSQLPostgres(table, blueprint)
    if (db === 'sqlite')   return this._buildCreateSQLSQLite(table, blueprint)
    return this._buildCreateSQLMySQL(table, blueprint)
  }

  // ---- MySQL / MariaDB ----

  private _buildCreateSQLMySQL(table: string, blueprint: Blueprint): string {
    const lines: string[] = []

    for (const col of blueprint.columns) {
      lines.push('  ' + this._buildColumnSQL(col, 'mysql'))
    }

    const primaryCol = blueprint.columns.find(c => c.primary)
    if (primaryCol) {
      lines.push(`  PRIMARY KEY (\`${primaryCol.name}\`)`)
    }

    const uniqueCols = blueprint.columns.filter(c => c.unique && !c.primary)
    for (const col of uniqueCols) {
      lines.push(`  UNIQUE KEY \`${table}_${col.name}_unique\` (\`${col.name}\`)`)
    }

    const foreignCols = blueprint.columns.filter(c => c.references)
    for (const col of foreignCols) {
      const onDelete = col.onDelete ?? 'RESTRICT'
      const onUpdate = col.onUpdate ?? 'CASCADE'
      lines.push(
        `  CONSTRAINT \`fk_${table}_${col.name}\` FOREIGN KEY (\`${col.name}\`) ` +
        `REFERENCES \`${col.references!.table}\` (\`${col.references!.column}\`) ` +
        `ON DELETE ${onDelete} ON UPDATE ${onUpdate}`
      )
    }

    return [
      `CREATE TABLE IF NOT EXISTS \`${table}\` (`,
      lines.join(',\n'),
      `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
    ].join('\n')
  }

  // ---- PostgreSQL ----

  private _buildCreateSQLPostgres(table: string, blueprint: Blueprint): string {
    const lines: string[] = []

    for (const col of blueprint.columns) {
      lines.push('  ' + this._buildColumnSQL(col, 'postgres'))
    }

    const uniqueCols = blueprint.columns.filter(c => c.unique && !c.primary)
    for (const col of uniqueCols) {
      lines.push(`  UNIQUE ("${col.name}")`)
    }

    const foreignCols = blueprint.columns.filter(c => c.references)
    for (const col of foreignCols) {
      const onDelete = col.onDelete ?? 'RESTRICT'
      const onUpdate = col.onUpdate ?? 'CASCADE'
      lines.push(
        `  CONSTRAINT "fk_${table}_${col.name}" FOREIGN KEY ("${col.name}") ` +
        `REFERENCES "${col.references!.table}" ("${col.references!.column}") ` +
        `ON DELETE ${onDelete} ON UPDATE ${onUpdate}`
      )
    }

    return [
      `CREATE TABLE IF NOT EXISTS "${table}" (`,
      lines.join(',\n'),
      `);`
    ].join('\n')
  }

  // ---- SQLite ----

  private _buildCreateSQLSQLite(table: string, blueprint: Blueprint): string {
    const lines: string[] = []

    for (const col of blueprint.columns) {
      lines.push('  ' + this._buildColumnSQL(col, 'sqlite'))
    }

    const foreignCols = blueprint.columns.filter(c => c.references)
    for (const col of foreignCols) {
      const onDelete = col.onDelete ?? 'RESTRICT'
      lines.push(
        `  FOREIGN KEY (\`${col.name}\`) ` +
        `REFERENCES \`${col.references!.table}\` (\`${col.references!.column}\`) ` +
        `ON DELETE ${onDelete}`
      )
    }

    return [
      `CREATE TABLE IF NOT EXISTS \`${table}\` (`,
      lines.join(',\n'),
      `);`
    ].join('\n')
  }

  // -----------------------------------------------
  // Column SQL por banco
  // -----------------------------------------------

  private _buildColumnSQL(col: ColumnDefinition, db: DbType): string {
    const parts: string[] = []

    if (db === 'postgres') {
      parts.push(`"${col.name}"`)
      parts.push(this._buildTypePostgres(col))
    } else {
      parts.push(`\`${col.name}\``)
      parts.push(this._buildTypeMySQL(col, db))
      if (col.unsigned && !['sqlite'].includes(db)) parts.push('UNSIGNED')
    }

    if (col.nullable) {
      parts.push('NULL')
    } else {
      parts.push('NOT NULL')
    }

    if (col.default !== undefined) {
      const isRawDefault =
        typeof col.default === 'string' &&
        (col.default === 'CURRENT_TIMESTAMP' || col.default.startsWith('NOW'))
      if (isRawDefault) {
        parts.push(`DEFAULT ${col.default}`)
      } else if (typeof col.default === 'string') {
        parts.push(`DEFAULT '${col.default}'`)
      } else {
        parts.push(`DEFAULT ${col.default}`)
      }
    }

    if (col.autoIncrement) {
      if (db === 'postgres') {
        // Postgres usa SERIAL/BIGSERIAL — autoIncrement é tratado no tipo
      } else {
        parts.push('AUTO_INCREMENT')
      }
    }

    return parts.join(' ')
  }

  // ---- Tipos MySQL/MariaDB/SQLite ----

  private _buildTypeMySQL(col: ColumnDefinition, db: DbType): string {
    switch (col.type) {
      case 'VARCHAR':    return `VARCHAR(${col.length ?? 255})`
      case 'CHAR':       return `CHAR(${col.length ?? 1})`
      case 'TINYINT':    return `TINYINT(${col.length ?? 4})`
      case 'SMALLINT':   return 'SMALLINT'
      case 'INT':        return 'INT'
      case 'BIGINT':     return 'BIGINT'
      case 'FLOAT':      return `FLOAT(${col.precision ?? 8}, ${col.scale ?? 2})`
      case 'DOUBLE':     return `DOUBLE(${col.precision ?? 15}, ${col.scale ?? 8})`
      case 'DECIMAL':    return `DECIMAL(${col.precision ?? 8}, ${col.scale ?? 2})`
      case 'BOOLEAN':    return db === 'sqlite' ? 'INTEGER' : 'TINYINT(1)'
      case 'TEXT':       return 'TEXT'
      case 'MEDIUMTEXT': return db === 'sqlite' ? 'TEXT' : 'MEDIUMTEXT'
      case 'LONGTEXT':   return db === 'sqlite' ? 'TEXT' : 'LONGTEXT'
      case 'DATE':       return 'DATE'
      case 'DATETIME':   return db === 'sqlite' ? 'TEXT' : 'DATETIME'
      case 'TIMESTAMP':  return db === 'sqlite' ? 'TEXT' : 'TIMESTAMP'
      case 'TIME':       return db === 'sqlite' ? 'TEXT' : 'TIME'
      case 'YEAR':       return db === 'sqlite' ? 'INTEGER' : 'YEAR'
      case 'JSON':       return db === 'sqlite' ? 'TEXT' : 'JSON'
      case 'BLOB':       return 'BLOB'
      case 'ENUM':       return db === 'sqlite'
        ? 'TEXT'
        : `ENUM(${(col.values ?? []).map((v: string) => `'${v}'`).join(', ')})`
      default:           return col.type
    }
  }

  // ---- Tipos PostgreSQL ----

  private _buildTypePostgres(col: ColumnDefinition): string {
    // Postgres: id com autoIncrement vira BIGSERIAL
    if (col.autoIncrement && col.type === 'BIGINT') return 'BIGSERIAL PRIMARY KEY'
    if (col.autoIncrement && col.type === 'INT')    return 'SERIAL PRIMARY KEY'

    switch (col.type) {
      case 'VARCHAR':    return `VARCHAR(${col.length ?? 255})`
      case 'CHAR':       return `CHAR(${col.length ?? 1})`
      case 'TINYINT':    return 'SMALLINT'
      case 'SMALLINT':   return 'SMALLINT'
      case 'INT':        return 'INTEGER'
      case 'BIGINT':     return 'BIGINT'
      case 'FLOAT':      return 'REAL'
      case 'DOUBLE':     return 'DOUBLE PRECISION'
      case 'DECIMAL':    return `NUMERIC(${col.precision ?? 8}, ${col.scale ?? 2})`
      case 'BOOLEAN':    return 'BOOLEAN'
      case 'TEXT':       return 'TEXT'
      case 'MEDIUMTEXT': return 'TEXT'
      case 'LONGTEXT':   return 'TEXT'
      case 'DATE':       return 'DATE'
      case 'DATETIME':   return 'TIMESTAMP'
      case 'TIMESTAMP':  return 'TIMESTAMP'
      case 'TIME':       return 'TIME'
      case 'YEAR':       return 'SMALLINT'
      case 'JSON':       return 'JSONB'
      case 'BLOB':       return 'BYTEA'
      case 'ENUM':       return 'TEXT'
      default:           return col.type
    }
  }
}