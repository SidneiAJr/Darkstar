import kleur from 'kleur'
import * as fs from 'fs'
import * as path from 'path'
import { Connection } from '@darkstar/orm'

function success(msg: string) { console.log(kleur.green('  ✔ ') + msg) }
function info(msg: string)    { console.log(kleur.cyan('  → ') + msg) }
function error(msg: string)   { console.log(kleur.red('  ✘ ') + msg) }
function warn(msg: string)    { console.log(kleur.yellow('  ⚠ ') + msg) }

export async function dbMigrate() {
  info('Rodando migrations...')

  try {
    await Connection.connect()
    const driver = Connection.get()
    const db = driver.type()

    // 1. Garante que a tabela de controle existe
    const createTableSQL = db === 'sqlite'
      ? `CREATE TABLE IF NOT EXISTS tanis_migrations (
          id      INTEGER PRIMARY KEY AUTOINCREMENT,
          name    TEXT NOT NULL UNIQUE,
          ran_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      : `CREATE TABLE IF NOT EXISTS tanis_migrations (
          id      INT AUTO_INCREMENT PRIMARY KEY,
          name    VARCHAR(255) NOT NULL UNIQUE,
          ran_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        )`

    await driver.query(createTableSQL)

    // 2. Lê as migrations que já rodaram
    const { rows } = await driver.query<{ name: string }>(
      `SELECT name FROM tanis_migrations`
    )
    const ran = new Set(rows.map(r => r.name))

    // 3. Lê os arquivos da pasta database/migrations/
    const migrationsDir = path.resolve(process.cwd(), 'database/migrations')

    if (!fs.existsSync(migrationsDir)) {
      warn('Pasta database/migrations não encontrada.')
      await Connection.disconnect()
      return
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.ts') || f.endsWith('.js'))
      .sort()

    const pending = files.filter(f => !ran.has(f))

    if (pending.length === 0) {
      info('Nenhuma migration pendente.')
      await Connection.disconnect()
      return
    }

    // 4. Roda cada migration pendente
    for (const file of pending) {
      const filePath = path.join(migrationsDir, file)
      const migration = await import(filePath)

      if (typeof migration.up !== 'function') {
        warn(`${file} não exporta uma função up() — pulando.`)
        continue
      }

      info(`Rodando: ${file}`)
      await migration.up(driver)

      await driver.query(
        `INSERT INTO tanis_migrations (name) VALUES (?)`,
        [file]
      )

      success(file)
    }

    await Connection.disconnect()
    console.log('')
    success(`${pending.length} migration(s) executada(s).`)

  } catch (err: any) {
    error(`Falha: ${err.message}`)
    process.exit(1)
  }
}