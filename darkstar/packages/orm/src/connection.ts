import * as dotenv from 'dotenv'
import { BaseDriver } from './drivers/base-driver'
import { SQLiteDriver } from './drivers/sqlite-driver'
import { MySQLDriver } from './drivers/mysql-driver'
import { PostgresDriver } from './drivers/postgres-driver'

dotenv.config()

// -----------------------------------------------
// Connection — lê .env e instancia o driver certo
// -----------------------------------------------

export class Connection {
  private static driver: BaseDriver | null = null

  static async connect(): Promise<void> {
    const db = process.env.DB_CONNECTION ?? 'sqlite'

    if (db === 'sqlite') {
      this.driver = new SQLiteDriver(
        process.env.DB_DATABASE ?? './database.sqlite'
      )
    } else if (db === 'mysql' || db === 'mariadb') {
      this.driver = new MySQLDriver({
        type:     db,
        host:     process.env.DB_HOST     ?? '127.0.0.1',
        port:     Number(process.env.DB_PORT ?? 3306),
        database: process.env.DB_DATABASE ?? 'tanis',
        user:     process.env.DB_USERNAME ?? 'root',
        password: process.env.DB_PASSWORD ?? '',
      })
    } else if (db === 'postgres') {
      this.driver = new PostgresDriver({
        host:     process.env.DB_HOST     ?? '127.0.0.1',
        port:     Number(process.env.DB_PORT ?? 5432),
        database: process.env.DB_DATABASE ?? 'tanis',
        user:     process.env.DB_USERNAME ?? 'postgres',
        password: process.env.DB_PASSWORD ?? '',
      })
    } else {
      throw new Error(`[Tanis ORM] DB_CONNECTION inválido: "${db}". Use sqlite | mysql | mariadb | postgres`)
    }

    await this.driver.connect()
  }

  static get(): BaseDriver {
    if (!this.driver) throw new Error('[Tanis ORM] Banco não conectado. Chame Connection.connect() primeiro.')
    return this.driver
  }

  static async disconnect(): Promise<void> {
    await this.driver?.disconnect()
    this.driver = null
  }

  static async ping(): Promise<boolean> {
    return this.driver?.ping() ?? false
  }
}
