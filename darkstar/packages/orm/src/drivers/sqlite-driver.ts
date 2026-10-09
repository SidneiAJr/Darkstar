import { BaseDriver, QueryResult } from './base-driver'
import Database from 'better-sqlite3'

// -----------------------------------------------
// SQLiteDriver
// -----------------------------------------------

export class SQLiteDriver implements BaseDriver {
  private db: Database.Database | null = null
  private filename: string

  constructor(filename: string) {
    this.filename = filename
  }

  type(): 'sqlite' {
    return 'sqlite'
  }

  async connect(): Promise<void> {
    this.db = new Database(this.filename)
  }

  async disconnect(): Promise<void> {
    this.db?.close()
    this.db = null
  }

  async ping(): Promise<boolean> {
    try {
      this.get().prepare('SELECT 1').run()
      return true
    } catch {
      return false
    }
  }

  async query<T = any>(sql: string, bindings: any[] = []): Promise<QueryResult<T>> {
    const db   = this.get()
    const stmt = db.prepare(sql)
    const verb = sql.trim().toUpperCase().split(' ')[0]

    if (verb === 'SELECT') {
      const rows = stmt.all(...bindings) as T[]
      return { rows, affectedRows: rows.length }
    }

    const result = stmt.run(...bindings)
    return {
      rows: [],
      affectedRows: result.changes,
      insertId: result.lastInsertRowid as number,
    }
  }

  private get(): Database.Database {
    if (!this.db) throw new Error('[DarkStar ORM] SQLite não conectado.')
    return this.db
  }
}
