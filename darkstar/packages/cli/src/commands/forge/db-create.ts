import kleur from 'kleur'

function success(msg: string) { console.log(kleur.green('  ✔ ') + msg) }
function info(msg: string)    { console.log(kleur.cyan('  → ') + msg) }
function error(msg: string)   { console.log(kleur.red('  ✘ ') + msg) }

export async function dbCreate() {
  const db       = process.env.DB_CONNECTION ?? process.env.DB_CLIENT ?? 'mysql'
  const database = process.env.DB_DATABASE   ?? 'darkstar'

  info(`Criando banco: ${database}...`)

  try {
    if (db === 'mysql' || db === 'mariadb') {
      const mysql = await import('mysql2/promise')
      const conn = await mysql.createConnection({
        host:     process.env.DB_HOST     ?? '127.0.0.1',
        port:     Number(process.env.DB_PORT ?? 3306),
        user:     process.env.DB_USERNAME ?? process.env.DB_USER ?? 'root',
        password: process.env.DB_PASSWORD ?? '',
      })
      await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``)
      await conn.end()
    }

    if (db === 'postgres' || db === 'postgresql') {
      const { Client } = await import('pg')
      const client = new Client({
        host:     process.env.DB_HOST     ?? '127.0.0.1',
        port:     Number(process.env.DB_PORT ?? 5432),
        user:     process.env.DB_USERNAME ?? process.env.DB_USER ?? 'postgres',
        password: process.env.DB_PASSWORD ?? '',
        database: 'postgres',
      })
      await client.connect()

      const res = await client.query(
        `SELECT 1 FROM pg_database WHERE datname = $1`,
        [database]
      )

      if (res.rowCount === 0) {
        await client.query(`CREATE DATABASE "${database}"`)
      } else {
        info(`Banco "${database}" já existe, pulando...`)
      }

      await client.end()
    }

    success(`Banco "${database}" criado com sucesso!`)

  } catch (err: any) {
    error(`Falha: ${err.message}`)
    process.exit(1)
  }
}