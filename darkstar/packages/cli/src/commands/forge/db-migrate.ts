import kleur from 'kleur'
import * as fs from 'fs'
import * as path from 'path'
import { Connection } from '@darkstar-cli/orm'

function success(msg: string) { console.log(kleur.green('  ✔ ') + msg) }
function info(msg: string)    { console.log(kleur.cyan('  → ') + msg) }
function error(msg: string)   { console.log(kleur.red('  ✘ ') + msg) }
function warn(msg: string)    { console.log(kleur.yellow('  ⚠ ') + msg) }

async function acquireLock(driver: any, db: string): Promise<{ locked: boolean, conn?: any }> {
  try {
    if (db === 'postgres') {
      const { rows } = await driver.query(
        `SELECT pg_try_advisory_lock(123456789) as result`
      ) as { rows: { result: boolean }[] }
      return { locked: rows[0]?.result === true }
    } else {
      const dbName = process.env.DB_DATABASE
      if (!dbName) {
        error('DB_DATABASE não está definido no .env — não é possível adquirir o lock.')
        return { locked: false }
      }

      const conn = await driver.getConnection()
      const [rows] = await conn.query(
        `SELECT GET_LOCK(?, 0) as result`,
        [`darkstar_migrate_${dbName}`]
      )
      if ((rows as any)[0]?.result !== 1) {
        conn.release()
        return { locked: false }
      }
      return { locked: true, conn }
    }
  } catch (err: any) {
    error(`Falha ao adquirir lock: ${err.message}`)
    return { locked: false }
  }
}

async function releaseLock(driver: any, db: string, conn?: any) {
  try {
    if (db === 'postgres') {
      await driver.query(`SELECT pg_advisory_unlock(123456789)`)
    } else if (conn) {
      const dbName = process.env.DB_DATABASE
      if (dbName) {
        await conn.query(`SELECT RELEASE_LOCK(?)`, [`darkstar_migrate_${dbName}`])
      }
      conn.release()
    }
  } catch (err: any) {
    warn(`Falha ao liberar lock: ${err.message}`)
  }
}

export async function dbMigrate() {
  info('Rodando migrations...')

  try {
    await Connection.connect()
  } catch (err: any) {
    error(`Não foi possível conectar ao banco: ${err.message}`)
    process.exit(1)
  }

  const driver = Connection.get()
  const db = driver.type()

  const { locked, conn } = await acquireLock(driver, db)
  if (!locked) {
    error('Outra instância já está rodando migrations. Tente novamente.')
    await Connection.disconnect()
    process.exit(1)
  }

  const cleanup = async (signal: string) => {
    warn(`Recebido ${signal}, liberando lock e saindo...`)
    await releaseLock(driver, db, conn)
    await Connection.disconnect()
    process.exit(0)
  }
  process.on('SIGINT',  () => { cleanup('SIGINT') })
  process.on('SIGTERM', () => { cleanup('SIGTERM') })

  try {
    const createTableSQL = db === 'postgres'
      ? `CREATE TABLE IF NOT EXISTS darkstar_migrations (
          id      SERIAL PRIMARY KEY,
          name    VARCHAR(255) NOT NULL UNIQUE,
          ran_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
      : `CREATE TABLE IF NOT EXISTS darkstar_migrations (
          id      INT AUTO_INCREMENT PRIMARY KEY,
          name    VARCHAR(255) NOT NULL UNIQUE,
          ran_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        )`

    await driver.query(createTableSQL)

    const { rows } = await driver.query(
      `SELECT name FROM darkstar_migrations`
    ) as { rows: { name: string }[] }
    const ran = new Set(rows.map(r => r.name))

    const migrationsDir = path.resolve(process.cwd(), 'database/migrations')

    if (!fs.existsSync(migrationsDir)) {
      warn('Pasta database/migrations não encontrada.')
      return
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.ts') || f.endsWith('.js'))
      .sort()

    const pending = files.filter(f => !ran.has(f))

    if (pending.length === 0) {
      info('Nenhuma migration pendente.')
      return
    }

    for (const file of pending) {
      const filePath = path.join(migrationsDir, file)

      if (!fs.existsSync(filePath)) {
        warn(`${file} não encontrado no disco — pulando.`)
        continue
      }

      let migration: any
      try {
        migration = await import(filePath)
      } catch (err: any) {
        throw new Error(`Falha ao carregar ${file}: ${err.message}`)
      }

      if (typeof migration.up !== 'function') {
        warn(`${file} não exporta uma função up() — pulando.`)
        continue
      }

      info(`Rodando: ${file}`)

      try {
        const begin = db === 'postgres' ? 'BEGIN' : 'START TRANSACTION'
        await driver.query(begin)
        await migration.up(driver)
        const sql = db === 'postgres'
          ? `INSERT INTO darkstar_migrations (name) VALUES ($1)`
          : `INSERT INTO darkstar_migrations (name) VALUES (?)`
        await driver.query(sql, [file])
        await driver.query('COMMIT')
        success(file)
      } catch (err: any) {
        try { await driver.query('ROLLBACK') } catch {}
        throw new Error(`Falha em ${file}: ${err.message}`)
      }
    }

    console.log('')
    success(`${pending.length} migration(s) executada(s).`)

  } catch (err: any) {
    error(err.message)
    warn('Migration interrompida. Corrija o erro e rode db:migrate novamente.')
    process.exitCode = 1
  } finally {
    await releaseLock(driver, db, conn)
    await Connection.disconnect()
  }
}