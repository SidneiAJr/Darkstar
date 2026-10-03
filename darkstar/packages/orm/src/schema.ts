import { Blueprint, ColumnDefinition } from './blueprint'
import { BaseDriver } from './drivers/base-driver'

export class Schema {
  private driver: BaseDriver

  constructor(driver: BaseDriver) {
    this.driver = driver
  }

  async create(table: string, callback: (blueprint: Blueprint) => void): Promise<void> {
    const blueprint = new Blueprint()
    callback(blueprint)
    const sql = this._buildCreateSQL(table, blueprint)
    await this.driver.query(sql)
  }

  async drop(table: string): Promise<void> {
    await this.driver.query(`DROP TABLE IF EXISTS \`${table}\``)
  }

  async hasTable(table: string): Promise<boolean> {
    const { rows } = await this.driver.query(`SHOW TABLES LIKE '${table}'`)
    return rows.length > 0
  }

  async addColumn(table: string, callback: (blueprint: Blueprint) => void): Promise<void> {
    const blueprint = new Blueprint()
    callback(blueprint)
    for (const col of blueprint.columns) {
      const colSQL = this._buildColumnSQL(col)
      await this.driver.query(`ALTER TABLE \`${table}\` ADD COLUMN ${colSQL}`)
    }
  }

  async dropColumn(table: string, column: string): Promise<void> {
    await this.driver.query(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\``)
  }

  private _buildCreateSQL(table: string, blueprint: Blueprint): string {
    const lines: string[] = []

    for (const col of blueprint.columns) {
      lines.push('  ' + this._buildColumnSQL(col))
    }

    const primaryCol = blueprint.columns.find(c => c.primary)
    if (primaryCol) {
      lines.push(`  PRIMARY KEY (\`${primaryCol.name}\`)`)
    }

    const uniqueCols = blueprint.columns.filter(c => c.unique && !c.primary)
    for (const col of uniqueCols) {
      lines.push(`  UNIQUE KEY \`${col.name}_unique\` (\`${col.name}\`)`)
    }

    const foreignCols = blueprint.columns.filter(c => c.references)
    for (const col of foreignCols) {
      lines.push(
        `  CONSTRAINT \`fk_${col.name}\` FOREIGN KEY (\`${col.name}\`) ` +
        `REFERENCES \`${col.references!.table}\` (\`${col.references!.column}\`)`
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
      case 'VARCHAR':  return `VARCHAR(${col.length ?? 255})`
      case 'TINYINT':  return `TINYINT(${col.length ?? 1})`
      case 'INT':      return 'INT'
      case 'BIGINT':   return 'BIGINT'
      case 'FLOAT':    return `FLOAT(${col.precision ?? 8}, ${col.scale ?? 2})`
      case 'DECIMAL':  return `DECIMAL(${col.precision ?? 8}, ${col.scale ?? 2})`
      case 'TEXT':     return 'TEXT'
      case 'LONGTEXT': return 'LONGTEXT'
      case 'DATE':     return 'DATE'
      case 'DATETIME': return 'DATETIME'
      case 'TIMESTAMP':return 'TIMESTAMP'
      case 'JSON':     return 'JSON'
      default:         return col.type
    }
  }
}