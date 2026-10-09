import { BaseDriver, QueryResult } from './base-driver'
import { Pool } from 'pg'

// -----------------------------------------------
// PostgresDriver
// -----------------------------------------------

export interface PostgresConfig {
  host: string
  port: number
  database: string
  user: string
  password: string
}

export class PostgresDriver implements BaseDriver {
  private pool: Pool | null = null
  private config: PostgresConfig

  constructor(config: PostgresConfig) {
    this.config = config
  }

  type(): 'postgres' {
    return 'postgres'
  }

  async connect(): Promise<void> {
    this.pool = new Pool({
      host:     this.config.host,
      port:     this.config.port,
      database: this.config.database,
      user:     this.config.user,
      password: this.config.password,
      max:      10,
    })
  }

  async disconnect(): Promise<void> {
    await this.pool?.end()
    this.pool = null
  }

  async ping(): Promise<boolean> {
    try {
      await this.pool?.query('SELECT 1')
      return true
    } catch {
      return false
    }
  }

  async query<T = any>(sql: string, bindings: any[] = []): Promise<QueryResult<T>> {
    if (!this.pool) throw new Error('[DarkStar ORM] PostgreSQL não conectado.')

    const result = await this.pool.query(sql, bindings)

    return {
      rows:         result.rows as T[],
      affectedRows: result.rowCount ?? 0,
      insertId:     result.rows[0]?.id,
    }
  }
}
