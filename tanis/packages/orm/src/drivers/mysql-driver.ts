import { BaseDriver, QueryResult } from './base-driver'
import mysql, { Pool, PoolConnection } from 'mysql2/promise'

// -----------------------------------------------
// MySQLDriver — funciona com MySQL e MariaDB
// -----------------------------------------------

export interface MySQLConfig {
  host: string
  port: number
  database: string
  user: string
  password: string
  type: 'mysql' | 'mariadb'
}

export class MySQLDriver implements BaseDriver {
  private pool: Pool | null = null
  private config: MySQLConfig

  constructor(config: MySQLConfig) {
    this.config = config
  }

  type(): 'mysql' | 'mariadb' {
    return this.config.type
  }

  async connect(): Promise<void> {
    this.pool = mysql.createPool({
      host:     this.config.host,
      port:     this.config.port,
      database: this.config.database,
      user:     this.config.user,
      password: this.config.password,
      waitForConnections: true,
      connectionLimit:    10,
    })
  }

  async disconnect(): Promise<void> {
    await this.pool?.end()
    this.pool = null
  }

  async ping(): Promise<boolean> {
    try {
      const conn = await this.getConnection()
      await conn.query('SELECT 1')
      conn.release()
      return true
    } catch {
      return false
    }
  }

  async query<T = any>(sql: string, bindings: any[] = []): Promise<QueryResult<T>> {
    const conn = await this.getConnection()
    try {
      const [result] = await conn.query(sql, bindings)

      if (Array.isArray(result)) {
        return { rows: result as T[], affectedRows: result.length }
      }

      const res = result as any
      return {
        rows: [],
        affectedRows: res.affectedRows ?? 0,
        insertId: res.insertId,
      }
    } finally {
      conn.release()
    }
  }

  private async getConnection(): Promise<PoolConnection> {
    if (!this.pool) throw new Error('[Tanis ORM] MySQL não conectado.')
    return this.pool.getConnection()
  }
}
