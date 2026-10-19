import { BaseDriver } from './drivers/base-driver'
import type { Model } from './model'

type WhereOperator = '=' | '!=' | '>' | '>=' | '<' | '<=' | 'LIKE' | 'IN' | 'NOT IN' | 'IS NULL' | 'IS NOT NULL'
type OrderDirection = 'asc' | 'desc'
type WhereType = 'AND' | 'OR'

interface WhereClause {
  column: string
  operator: WhereOperator
  value: any
  type: WhereType
}

interface OrderClause {
  column: string
  direction: OrderDirection
}

export class QueryBuilder<T = any> {
  private _table: string
  private _driver: BaseDriver
  private _wheres: WhereClause[] = []
  private _orders: OrderClause[] = []
  private _limitValue?: number
  private _offsetValue?: number
  private _selectColumns: string[] = ['*']
  private _withTrashed: boolean = false
  private _onlyTrashed: boolean = false

  // Eager loading
  private _with: string[] = []
  private _model: typeof Model | null = null

  constructor(driver: BaseDriver, table: string, model?: typeof Model) {
    this._driver = driver
    this._table  = table
    this._model  = model ?? null
  }

  // -----------------------------------------------
  // Eager loading
  // -----------------------------------------------

  with(...relations: string[]): this {
    this._with.push(...relations)
    return this
  }

  // -----------------------------------------------
  // SELECT
  // -----------------------------------------------

  select(...columns: string[]): this {
    this._selectColumns = columns
    return this
  }

  // -----------------------------------------------
  // WHERE
  // -----------------------------------------------

  where(column: string, value: any): this
  where(column: string, operator: WhereOperator, value: any): this
  where(column: string, operatorOrValue: any, value?: any): this {
    if (value === undefined) {
      this._wheres.push({ column, operator: '=', value: operatorOrValue, type: 'AND' })
    } else {
      this._wheres.push({ column, operator: operatorOrValue, value, type: 'AND' })
    }
    return this
  }

  orWhere(column: string, value: any): this
  orWhere(column: string, operator: WhereOperator, value: any): this
  orWhere(column: string, operatorOrValue: any, value?: any): this {
    if (value === undefined) {
      this._wheres.push({ column, operator: '=', value: operatorOrValue, type: 'OR' })
    } else {
      this._wheres.push({ column, operator: operatorOrValue, value, type: 'OR' })
    }
    return this
  }

  whereIn(column: string, values: any[]): this {
    this._wheres.push({ column, operator: 'IN', value: values, type: 'AND' })
    return this
  }

  whereNotIn(column: string, values: any[]): this {
    this._wheres.push({ column, operator: 'NOT IN', value: values, type: 'AND' })
    return this
  }

  whereLike(column: string, value: string): this {
    this._wheres.push({ column, operator: 'LIKE', value, type: 'AND' })
    return this
  }

  whereNull(column: string): this {
    this._wheres.push({ column, operator: 'IS NULL', value: null, type: 'AND' })
    return this
  }

  whereNotNull(column: string): this {
    this._wheres.push({ column, operator: 'IS NOT NULL', value: null, type: 'AND' })
    return this
  }

  // -----------------------------------------------
  // Soft delete
  // -----------------------------------------------

  withTrashed(): this {
    this._withTrashed = true
    return this
  }

  onlyTrashed(): this {
    this._onlyTrashed = true
    return this
  }

  // -----------------------------------------------
  // ORDER / LIMIT / OFFSET
  // -----------------------------------------------

  orderBy(column: string, direction: OrderDirection = 'asc'): this {
    this._orders.push({ column, direction })
    return this
  }

  limit(value: number): this {
    this._limitValue = value
    return this
  }

  offset(value: number): this {
    this._offsetValue = value
    return this
  }

  // -----------------------------------------------
  // BUILD SQL
  // -----------------------------------------------

  private _hasSoftDelete(): boolean {
    return !!(this._model && (this._model as any).softDelete === true)
  }

  private build(): { sql: string; bindings: any[] } {
    const bindings: any[] = []
    const cols = this._selectColumns.join(', ')
    let sql = `SELECT ${cols} FROM ${this._table}`

    const allWheres = [...this._wheres]

    // Soft delete filter automático
    if (this._hasSoftDelete()) {
      if (this._onlyTrashed) {
        allWheres.push({ column: 'deleted_at', operator: 'IS NOT NULL', value: null, type: 'AND' })
      } else if (!this._withTrashed) {
        allWheres.push({ column: 'deleted_at', operator: 'IS NULL', value: null, type: 'AND' })
      }
    }

    if (allWheres.length > 0) {
      const clauses = allWheres.map((w, i) => {
        let clause = ''

        if (w.operator === 'IS NULL') {
          clause = `${w.column} IS NULL`
        } else if (w.operator === 'IS NOT NULL') {
          clause = `${w.column} IS NOT NULL`
        } else if (w.operator === 'IN' || w.operator === 'NOT IN') {
          const arr = Array.isArray(w.value) ? w.value : []
          if (arr.length === 0) {
            clause = w.operator === 'IN' ? '1 = 0' : '1 = 1'
          } else {
            const placeholders = arr.map(() => '?').join(', ')
            bindings.push(...arr)
            clause = `${w.column} ${w.operator} (${placeholders})`
          }
        } else {
          bindings.push(w.value)
          clause = `${w.column} ${w.operator} ?`
        }

        // Primeiro WHERE não tem prefixo AND/OR
        return i === 0 ? clause : `${w.type} ${clause}`
      })
      sql += ` WHERE ${clauses.join(' ')}`
    }

    if (this._orders.length > 0) {
      const orders = this._orders.map(o => `${o.column} ${o.direction.toUpperCase()}`)
      sql += ` ORDER BY ${orders.join(', ')}`
    }

    if (this._limitValue !== undefined) sql += ` LIMIT ${this._limitValue}`
    if (this._offsetValue !== undefined) sql += ` OFFSET ${this._offsetValue}`

    return { sql, bindings }
  }

  // -----------------------------------------------
  // FETCH
  // -----------------------------------------------

  async get(): Promise<T[]> {
    const { sql, bindings } = this.build()
    const result = await this._driver.query<T>(sql, bindings)
    const rows = result.rows

    if (this._with.length > 0 && this._model) {
      await (this._model as any).loadRelations(rows, this._with)
    }

    return rows
  }

  async first(): Promise<T | null> {
    this._limitValue = 1
    const rows = await this.get()
    return rows[0] ?? null
  }

  async firstOrFail(): Promise<T> {
    const row = await this.first()
    if (!row) throw new Error(`[DarkStar ORM] Nenhum registro encontrado em "${this._table}"`)
    return row
  }

  async find(id: number | string): Promise<T | null> {
    const result = await this._driver.query<T>(
      `SELECT * FROM ${this._table} WHERE id = ? LIMIT 1`, [id]
    )
    const rows = result.rows

    if (this._with.length > 0 && this._model && rows.length > 0) {
      await (this._model as any).loadRelations(rows as any[], this._with)
    }

    return rows[0] ?? null
  }

  async findOrFail(id: number | string): Promise<T> {
    const row = await this.find(id)
    if (!row) throw new Error(`[DarkStar ORM] Registro id=${id} não encontrado em "${this._table}"`)
    return row
  }

  async all(): Promise<T[]> {
    const result = await this._driver.query<T>(`SELECT * FROM ${this._table}`)
    const rows = result.rows

    if (this._with.length > 0 && this._model) {
      await (this._model as any).loadRelations(rows, this._with)
    }

    return rows
  }

  // -----------------------------------------------
  // AGGREGATES
  // -----------------------------------------------

  async count(): Promise<number> {
    const { sql, bindings } = this.build()
    const countSql = sql.replace(/^SELECT .+ FROM/, 'SELECT COUNT(*) as total FROM')
    const result = await this._driver.query<{ total: number }>(countSql, bindings)
    return Number(result.rows[0]?.total ?? 0)
  }

  async exists(): Promise<boolean> {
    return (await this.count()) > 0
  }

  // -----------------------------------------------
  // WRITE
  // -----------------------------------------------

  async create(data: Partial<T>): Promise<T> {
    const keys         = Object.keys(data)
    const values       = Object.values(data)
    const placeholders = keys.map(() => '?').join(', ')
    const sql          = `INSERT INTO ${this._table} (${keys.join(', ')}) VALUES (${placeholders})`
    const result       = await this._driver.query(sql, values)
    return this.find(result.insertId!) as Promise<T>
  }

  async createMany(rows: Partial<T>[]): Promise<number> {
    if (rows.length === 0) return 0

    const keys         = Object.keys(rows[0])
    const placeholders = `(${keys.map(() => '?').join(', ')})`
    const allValues    = rows.flatMap(row => Object.values(row))
    const sql          = `INSERT INTO ${this._table} (${keys.join(', ')}) VALUES ${rows.map(() => placeholders).join(', ')}`
    const result       = await this._driver.query(sql, allValues)
    return result.affectedRows
  }

  async update(data: Partial<T>): Promise<number> {
    const keys   = Object.keys(data)
    const values = Object.values(data)

    if (keys.length === 0) return 0

    const sets = keys.map(k => `${k} = ?`).join(', ')

    const bindings: any[] = []
    const whereClauses: string[] = []

    for (const w of this._wheres) {
      if (w.operator === 'IS NULL') {
        whereClauses.push(`${w.column} IS NULL`)
      } else if (w.operator === 'IS NOT NULL') {
        whereClauses.push(`${w.column} IS NOT NULL`)
      } else if (w.operator === 'IN' || w.operator === 'NOT IN') {
        const arr = Array.isArray(w.value) ? w.value : []
        if (arr.length === 0) {
          whereClauses.push(w.operator === 'IN' ? '1 = 0' : '1 = 1')
        } else {
          const placeholders = arr.map(() => '?').join(', ')
          bindings.push(...arr)
          whereClauses.push(`${w.column} ${w.operator} (${placeholders})`)
        }
      } else {
        bindings.push(w.value)
        whereClauses.push(`${w.column} ${w.operator} ?`)
      }
    }

    const whereSQL = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : ''
    const sql      = `UPDATE ${this._table} SET ${sets}${whereSQL}`
    const result   = await this._driver.query(sql, [...values, ...bindings])
    return result.affectedRows
  }

  async delete(): Promise<number> {
    // Soft delete automático se o model tiver softDelete
    if (this._hasSoftDelete()) {
      return this.update({ deleted_at: new Date().toISOString() } as any)
    }

    const bindings: any[]     = []
    const whereClauses: string[] = []

    for (const w of this._wheres) {
      if (w.operator === 'IS NULL') {
        whereClauses.push(`${w.column} IS NULL`)
      } else if (w.operator === 'IS NOT NULL') {
        whereClauses.push(`${w.column} IS NOT NULL`)
      } else if (w.operator === 'IN' || w.operator === 'NOT IN') {
        const arr = Array.isArray(w.value) ? w.value : []
        if (arr.length === 0) {
          whereClauses.push(w.operator === 'IN' ? '1 = 0' : '1 = 1')
        } else {
          const placeholders = arr.map(() => '?').join(', ')
          bindings.push(...arr)
          whereClauses.push(`${w.column} ${w.operator} (${placeholders})`)
        }
      } else {
        bindings.push(w.value)
        whereClauses.push(`${w.column} ${w.operator} ?`)
      }
    }

    const whereSQL = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : ''
    const sql      = `DELETE FROM ${this._table}${whereSQL}`
    const result   = await this._driver.query(sql, bindings)
    return result.affectedRows
  }

  async restore(): Promise<number> {
    return this.update({ deleted_at: null } as any)
  }

  // -----------------------------------------------
  // PAGINATE / DEBUG
  // -----------------------------------------------

  async paginate(page: number = 1, perPage: number = 15) {
    const total = await this.count()
    this._limitValue  = perPage
    this._offsetValue = (page - 1) * perPage
    const data = await this.get()
    return { data, total, page, perPage, lastPage: Math.ceil(total / perPage) }
  }

  toSql(): string {
    const { sql, bindings } = this.build()
    return bindings.reduce((s: string, b: any) => s.replace('?', JSON.stringify(b)), sql)
  }
}