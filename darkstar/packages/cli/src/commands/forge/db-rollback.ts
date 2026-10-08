import kleur from 'kleur'
import * as path from 'path'
import { Connection } from 'darkstar-orm'

function success(msg: string) { console.log(kleur.green('  ✔ ') + msg) }
function info(msg: string)    { console.log(kleur.cyan('  → ') + msg) }
function error(msg: string)   { console.log(kleur.red('  ✘ ') + msg) }
function warn(msg: string)    { console.log(kleur.yellow('  ⚠ ') + msg) }

export async function dbRollback() {
  info('Desfazendo última migration...')

  try {
    await Connection.connect()
    const driver = Connection.get()
    const db = driver.type()

    // 1. Pega a última migration executada
    const { rows } = await driver.query<{ name: string }>(
      `SELECT name FROM darkstar_migrations ORDER BY id DESC LIMIT 1`
    )

    if (rows.length === 0) {
      warn('Nenhuma migration para desfazer.')
      await Connection.disconnect()
      return
    }

    const last = rows[0].name

    // 2. Carrega o arquivo e chama down()
    const migrationsDir = path.resolve(process.cwd(), 'database/migrations')
    const filePath = path.join(migrationsDir, last)
    const migration = await import(filePath)

    if (typeof migration.down !== 'function') {
      warn(`${last} não exporta uma função down() — pulando.`)
      await Connection.disconnect()
      return
    }

    info(`Desfazendo: ${last}`)
    await migration.down(driver)

    // 3. Remove o registro da tabela de controle
    const sql = db === 'postgres'
      ? `DELETE FROM darkstar_migrations WHERE name = $1`
      : `DELETE FROM darkstar_migrations WHERE name = ?`

    await driver.query(sql, [last])

    await Connection.disconnect()
    console.log('')
    success(`${last} desfeita com sucesso.`)

  } catch (err: any) {
    error(`Falha: ${err.message}`)
    process.exit(1)
  }
}