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
    // Aceita DB_CONNECTION (padrão novo) ou DB_CLIENT (legado)
    const db = process.env.DB_CONNECTION
            ?? process.env.DB_CLIENT
            ?? 'sqlite'

    if (db === 'sqlite') {
      this.driver = new SQLiteDriver(
        process.env.DB_DATABASE ?? './database.sqlite'
      )
    } else if (db === 'mysql' || db === 'mariadb') {
      this.driver = new MySQLDriver({
        type:     db,
        host:     process.env.DB_HOST     ?? '127.0.0.1',
        port:     Number(process.env.DB_PORT ?? 3306),
        database: process.env.DB_DATABASE ?? 'darkstar',
        // Aceita DB_USERNAME ou DB_USER
        user:     process.env.DB_USERNAME ?? process.env.DB_USER ?? 'root',
        password: process.env.DB_PASSWORD ?? '',
      })
    } else if (db === 'postgres' || db === 'postgresql') {
      this.driver = new PostgresDriver({
        host:     process.env.DB_HOST     ?? '127.0.0.1',
        port:     Number(process.env.DB_PORT ?? 5432),
        database: process.env.DB_DATABASE ?? 'darkstar',
        // Aceita DB_USERNAME ou DB_USER
        user:     process.env.DB_USERNAME ?? process.env.DB_USER ?? 'postgres',
        password: process.env.DB_PASSWORD ?? '',
      })
    } else {
      throw new Error(
        `[DarkStar ORM] DB_CONNECTION inválido: "${db}". ` +
        `Use sqlite | mysql | mariadb | postgres`
      )
    }

    await this.driver.connect()
  }

  static get(): BaseDriver {
    if (!this.driver) {
      throw new Error('[DarkStar ORM] Banco não conectado. Chame Connection.connect() primeiro.')
    }
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