import kleur from 'kleur'
import * as fs from 'fs'
import * as path from 'path'
import { Connection } from '@darkstar-cli/orm'

function success(msg: string) { console.log(kleur.green('  ✔ ') + msg) }
function info(msg: string)    { console.log(kleur.cyan('  → ') + msg) }
function error(msg: string)   { console.log(kleur.red('  ✘ ') + msg) }
function warn(msg: string)    { console.log(kleur.yellow('  ⚠ ') + msg) }

export async function dbRollback() {
  info('Desfazendo última migration...')

  try {
    await Connection.connect()
  } catch (err: any) {
    error(`Não foi possível conectar ao banco: ${err.message}`)
    process.exit(1)
  }

  const driver = Connection.get()
  const db = driver.type()

  const cleanup = async (signal: string) => {
    warn(`Recebido ${signal}, saindo...`)
    await Connection.disconnect()
    process.exit(0)
  }
  process.on('SIGINT',  () => { cleanup('SIGINT') })
  process.on('SIGTERM', () => { cleanup('SIGTERM') })

  try {
    // 1. Pega a última migration executada
    const { rows } = await driver.query<{ name: string }>(
      `SELECT name FROM darkstar_migrations ORDER BY id DESC LIMIT 1`
    )

    if (rows.length === 0) {
      warn('Nenhuma migration para desfazer.')
      return
    }

    const last = rows[0].name

    // 2. Carrega o arquivo e chama down()
    const migrationsDir = path.resolve(process.cwd(), 'database/migrations')
    const filePath = path.join(migrationsDir, last)

    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo da migration não encontrado: ${last}`)
    }

    const migration = await import(filePath)

    if (typeof migration.down !== 'function') {
      warn(`${last} não exporta uma função down() — pulando.`)
      return
    }

    info(`Desfazendo: ${last}`)
    await migration.down(driver)

    // 3. Remove o registro da tabela de controle
    const sql = db === 'postgres'
      ? `DELETE FROM darkstar_migrations WHERE name = $1`
      : `DELETE FROM darkstar_migrations WHERE name = ?`

    await driver.query(sql, [last])

    console.log('')
    success(`${last} desfeita com sucesso.`)

  } catch (err: any) {
    error(err.message)
    process.exitCode = 1
  } finally {
    await Connection.disconnect()
  }
}