import kleur from 'kleur'
import path from 'path'
import { Connection } from '@darkstar/orm'

function success(msg: string) { console.log(kleur.green('  ✔ ') + msg) }
function info(msg: string)    { console.log(kleur.cyan('  → ') + msg) }
function error(msg: string)   { console.log(kleur.red('  ✘ ') + msg) }

export async function dbSeed() {
  info('Rodando seeders...')
  try {
    await Connection.connect()

    const seederPath = path.resolve(process.cwd(), 'database/seeders/DatabaseSeeder')
    const { DatabaseSeeder } = await import(seederPath)
    const seeder = new DatabaseSeeder()
    await seeder.run()

    success('Seeders executados com sucesso!')
    await Connection.disconnect()
  } catch (err: any) {
    error(`Falha: ${err.message}`)
    process.exit(1)
  }
}