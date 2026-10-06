export interface ColumnDefinition {
  name: string
  type: string
  nullable: boolean
  unique: boolean
  default?: any
  unsigned?: boolean
  autoIncrement?: boolean
  primary?: boolean
  length?: number
  precision?: number
  scale?: number
  values?: string[]           // para ENUM
  references?: { table: string; column: string }
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'
}

export class Blueprint {
  public columns: ColumnDefinition[] = []
  public primaryKey: string = 'id'

  // ========================
  // Chaves e IDs
  // ========================

  id(): this {
    this.columns.push({
      name: 'id',
      type: 'BIGINT',
      nullable: false,
      unique: false,
      unsigned: true,
      autoIncrement: true,
      primary: true,
    })
    return this
  }

  uuid(name: string = 'id'): this {
    this.primaryKey = name
    this.columns.push({
      name,
      type: 'VARCHAR',
      length: 36,
      nullable: false,
      unique: true,
      primary: true,
    })
    return this
  }

  // ========================
  // Strings
  // ========================

  string(name: string, length: number = 255): ColumnBuilder {
    return this._addColumn({ name, type: 'VARCHAR', length, nullable: false, unique: false })
  }

  char(name: string, length: number = 1): ColumnBuilder {
    return this._addColumn({ name, type: 'CHAR', length, nullable: false, unique: false })
  }

  text(name: string): ColumnBuilder {
    return this._addColumn({ name, type: 'TEXT', nullable: false, unique: false })
  }

  mediumText(name: string): ColumnBuilder {
    return this._addColumn({ name, type: 'MEDIUMTEXT', nullable: false, unique: false })
  }

  longText(name: string): ColumnBuilder {
    return this._addColumn({ name, type: 'LONGTEXT', nullable: false, unique: false })
  }

  enum(name: string, values: string[]): ColumnBuilder {
    return this._addColumn({ name, type: 'ENUM', values, nullable: false, unique: false })
  }

  // ========================
  // Números
  // ========================

  tinyInt(name: string): ColumnBuilder {
    return this._addColumn({ name, type: 'TINYINT', nullable: false, unique: false })
  }

  smallInt(name: string): ColumnBuilder {
    return this._addColumn({ name, type: 'SMALLINT', nullable: false, unique: false })
  }

  integer(name: string): ColumnBuilder {
    return this._addColumn({ name, type: 'INT', nullable: false, unique: false })
  }

  bigInteger(name: string): ColumnBuilder {
    return this._addColumn({ name, type: 'BIGINT', nullable: false, unique: false })
  }

  float(name: string, precision: number = 8, scale: number = 2): ColumnBuilder {
    return this._addColumn({ name, type: 'FLOAT', precision, scale, nullable: false, unique: false })
  }

  double(name: string, precision: number = 15, scale: number = 8): ColumnBuilder {
    return this._addColumn({ name, type: 'DOUBLE', precision, scale, nullable: false, unique: false })
  }

  decimal(name: string, precision: number = 8, scale: number = 2): ColumnBuilder {
    return this._addColumn({ name, type: 'DECIMAL', precision, scale, nullable: false, unique: false })
  }

  // ========================
  // Booleano
  // ========================

  boolean(name: string): ColumnBuilder {
    return this._addColumn({ name, type: 'TINYINT', length: 1, nullable: false, unique: false })
  }

  // ========================
  // Datas
  // ========================

  date(name: string): ColumnBuilder {
    return this._addColumn({ name, type: 'DATE', nullable: false, unique: false })
  }

  dateTime(name: string): ColumnBuilder {
    return this._addColumn({ name, type: 'DATETIME', nullable: false, unique: false })
  }

  timestamp(name: string): ColumnBuilder {
    return this._addColumn({ name, type: 'TIMESTAMP', nullable: false, unique: false })
  }

  year(name: string): ColumnBuilder {
    return this._addColumn({ name, type: 'YEAR', nullable: false, unique: false })
  }

  time(name: string): ColumnBuilder {
    return this._addColumn({ name, type: 'TIME', nullable: false, unique: false })
  }

  // created_at e updated_at — igual Laravel
  timestamps(): this {
    this.columns.push({
      name: 'created_at',
      type: 'TIMESTAMP',
      nullable: false,
      unique: false,
      default: 'CURRENT_TIMESTAMP',
    })
    this.columns.push({
      name: 'updated_at',
      type: 'TIMESTAMP',
      nullable: false,
      unique: false,
      default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    })
    return this
  }

  // deleted_at — soft delete
  softDeletes(): this {
    this.columns.push({
      name: 'deleted_at',
      type: 'TIMESTAMP',
      nullable: true,
      unique: false,
      default: undefined,
    })
    return this
  }

  // ========================
  // Binário / JSON
  // ========================

  json(name: string): ColumnBuilder {
    return this._addColumn({ name, type: 'JSON', nullable: false, unique: false })
  }

  binary(name: string): ColumnBuilder {
    return this._addColumn({ name, type: 'BLOB', nullable: false, unique: false })
  }

  // ========================
  // Chave estrangeira
  // ========================

  foreignId(name: string): ForeignKeyBuilder {
    const col: ColumnDefinition = {
      name,
      type: 'BIGINT',
      nullable: false,
      unique: false,
      unsigned: true,
    }
    this.columns.push(col)
    return new ForeignKeyBuilder(col)
  }

  // nullable foreignId — útil pra relações opcionais
  nullableForeignId(name: string): ForeignKeyBuilder {
    const col: ColumnDefinition = {
      name,
      type: 'BIGINT',
      nullable: true,
      unique: false,
      unsigned: true,
    }
    this.columns.push(col)
    return new ForeignKeyBuilder(col)
  }

  // ========================
  // Interno
  // ========================

  private _addColumn(def: ColumnDefinition): ColumnBuilder {
    this.columns.push(def)
    return new ColumnBuilder(def)
  }
}

// ========================
// Builder encadeável
// ========================

export class ColumnBuilder {
  constructor(protected col: ColumnDefinition) {}

  nullable(): this {
    this.col.nullable = true
    return this
  }

  notNullable(): this {
    this.col.nullable = false
    return this
  }

  unique(): this {
    this.col.unique = true
    return this
  }

  default(value: any): this {
    this.col.default = value
    return this
  }

  unsigned(): this {
    this.col.unsigned = true
    return this
  }

  // alias útil
  index(): this {
    return this
  }
}

export class ForeignKeyBuilder extends ColumnBuilder {
  constructor(protected col: ColumnDefinition) {
    super(col)
  }

  references(column: string): { on: (table: string) => ForeignKeyBuilder } {
    return {
      on: (table: string) => {
        this.col.references = { table, column }
        return this
      }
    }
  }

  // ações referenciais
  onDelete(action: ColumnDefinition['onDelete']): this {
    this.col.onDelete = action
    return this
  }

  onUpdate(action: ColumnDefinition['onUpdate']): this {
    this.col.onUpdate = action
    return this
  }

  // atalhos comuns
  cascadeOnDelete(): this {
    this.col.onDelete = 'CASCADE'
    return this
  }

  nullOnDelete(): this {
    this.col.nullable = true
    this.col.onDelete = 'SET NULL'
    return this
  }

  restrictOnDelete(): this {
    this.col.onDelete = 'RESTRICT'
    return this
  }
}