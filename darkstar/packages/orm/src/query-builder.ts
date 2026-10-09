import { BaseDriver } from './drivers/base-driver'
import type { Model } from './model'

type WhereOperator = '=' | '!=' | '>' | '>=' | '<' | '<=' | 'LIKE' | 'IN' | 'NOT IN'
type OrderDirection = 'asc' | 'desc'

interface WhereClause {
  column: string
  operator: WhereOperator
  value: any
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
      this._wheres.push({ column, operator: '=', value: operatorOrValue })
    } else {
      this._wheres.push({ column, operator: operatorOrValue, value })
    }
    return this
  }

  whereIn(column: string, values: any[]): this {
    this._wheres.push({ column, operator: 'IN', value: values })
    return this
  }

  whereNotIn(column: string, values: any[]): this {
    this._wheres.push({ column, operator: 'NOT IN', value: values })
    return this
  }

  whereLike(column: string, value: string): this {
    this._wheres.push({ column, operator: 'LIKE', value })
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

  private build(): { sql: string; bindings: any[] } {
    const bindings: any[] = []
    const cols = this._selectColumns.join(', ')
    let sql = `SELECT ${cols} FROM ${this._table}`

    if (this._wheres.length > 0) {
      const clauses = this._wheres.map(w => {
        if (w.operator === 'IN' || w.operator === 'NOT IN') {
          const arr = Array.isArray(w.value) ? w.value : []
          if (arr.length === 0) {
            // IN vazio → sempre falso; NOT IN vazio → sempre verdadeiro
            return w.operator === 'IN' ? '1 = 0' : '1 = 1'
          }
          const placeholders = arr.map(() => '?').join(', ')
          bindings.push(...arr)
          return `${w.column} ${w.operator} (${placeholders})`
        }
        bindings.push(w.value)
        return `${w.column} ${w.operator} ?`
      })
      sql += ` WHERE ${clauses.join(' AND ')}`
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
    const keys   = Object.keys(data)
    const values = Object.values(data)
    const placeholders = keys.map(() => '?').join(', ')
    const sql = `INSERT INTO ${this._table} (${keys.join(', ')}) VALUES (${placeholders})`
    const result = await this._driver.query(sql, values)
    return this.find(result.insertId!) as Promise<T>
  }

  async update(data: Partial<T>): Promise<number> {
    const { bindings: whereBindings, sql: whereSql } = this.build()
    const keys   = Object.keys(data)
    const values = Object.values(data)
    const sets   = keys.map(k => `${k} = ?`).join(', ')
    const whereClause = whereSql.includes('WHERE')
      ? whereSql.split('WHERE')[1].split('ORDER')[0].split('LIMIT')[0].trim()
      : ''
    const sql = `UPDATE ${this._table} SET ${sets}${whereClause ? ` WHERE ${whereClause}` : ''}`
    const result = await this._driver.query(sql, [...values, ...whereBindings])
    return result.affectedRows
  }

  async delete(): Promise<number> {
    const { sql: selectSql, bindings } = this.build()
    const whereClause = selectSql.includes('WHERE')
      ? selectSql.split('WHERE')[1].split('ORDER')[0].split('LIMIT')[0].trim()
      : ''
    const sql = `DELETE FROM ${this._table}${whereClause ? ` WHERE ${whereClause}` : ''}`
    const result = await this._driver.query(sql, bindings)
    return result.affectedRows
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