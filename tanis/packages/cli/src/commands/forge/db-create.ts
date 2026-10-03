import kleur from 'kleur'
import { Connection } from '@tanis/orm'

function success(msg: string) { console.log(kleur.green('  ✔ ') + msg) }
function info(msg: string)    { console.log(kleur.cyan('  → ') + msg) }
function error(msg: string)   { console.log(kleur.red('  ✘ ') + msg) }

export async function dbCreate() {
  const db       = process.env.DB_CONNECTION ?? 'sqlite'
  const database = process.env.DB_DATABASE   ?? 'tanis'

  info(`Criando banco: ${database}...`)

  try {
    if (db === 'sqlite') {
      info('SQLite não precisa de db:create — o arquivo é criado automaticamente.')
      return
    }

    if (db === 'mysql' || db === 'mariadb') {
      const mysql = await import('mysql2/promise')
      const conn = await mysql.createConnection({
        host:     process.env.DB_HOST     ?? '127.0.0.1',
        port:     Number(process.env.DB_PORT ?? 3306),
        user:     process.env.DB_USERNAME ?? 'root',
        password: process.env.DB_PASSWORD ?? '',
      })
      await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``)
      await conn.end()
    }

    if (db === 'postgres') {
      const { Client } = await import('pg')
      const client = new Client({
        host:     process.env.DB_HOST     ?? '127.0.0.1',
        port:     Number(process.env.DB_PORT ?? 5432),
        user:     process.env.DB_USERNAME ?? 'postgres',
        password: process.env.DB_PASSWORD ?? '',
        database: 'postgres', // conecta no banco padrão pra criar o novo
      })
      await client.connect()
      await client.query(`CREATE DATABASE "${database}"`)
      await client.end()
    }

    success(`Banco "${database}" criado com sucesso!`)

  } catch (err: any) {
    error(`Falha: ${err.message}`)
    process.exit(1)
  }
}