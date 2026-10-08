import kleur from 'kleur'
import * as fs from 'fs'
import * as path from 'path'
import { Connection } from 'darkstar-orm'

function success(msg: string) { console.log(kleur.green('  ✔ ') + msg) }
function info(msg: string)    { console.log(kleur.cyan('  → ') + msg) }
function error(msg: string)   { console.log(kleur.red('  ✘ ') + msg) }
function warn(msg: string)    { console.log(kleur.yellow('  ⚠ ') + msg) }

async function acquireLock(driver: any, db: string): Promise<boolean> {
  try {
    if (db === 'postgres') {
      await driver.query(`SELECT pg_advisory_lock(123456789)`)
    } else {
      const { rows } = await driver.query(
        `SELECT GET_LOCK('darkstar_migrate', 0) as result`
      ) as { rows: { result: number }[] }
      if (rows[0]?.result !== 1) return false
    }
    return true
  } catch {
    return false
  }
}

async function releaseLock(driver: any, db: string) {
  try {
    if (db === 'postgres') {
      await driver.query(`SELECT pg_advisory_unlock(123456789)`)
    } else {
      await driver.query(`SELECT RELEASE_LOCK('darkstar_migrate')`)
    }
  } catch {}
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

  const locked = await acquireLock(driver, db)
  if (!locked) {
    error('Outra instância já está rodando migrations. Tente novamente.')
    await Connection.disconnect()
    process.exit(1)
  }

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
        error(`Falha ao carregar ${file}: ${err.message}`)
        process.exit(1)
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
        error(`Falha em ${file}: ${err.message}`)
        warn('Migration interrompida. Corrija o erro e rode db:migrate novamente.')
        process.exit(1)
      }
    }

    console.log('')
    success(`${pending.length} migration(s) executada(s).`)

  } finally {
    await releaseLock(driver, db)
    await Connection.disconnect()
  }
}