import kleur from 'kleur'
import { Connection } from '@tanis/orm'

function success(msg: string) { console.log(kleur.green('  ✔ ') + msg) }
function info(msg: string)    { console.log(kleur.cyan('  → ') + msg) }
function error(msg: string)   { console.log(kleur.red('  ✘ ') + msg) }

export async function dbSeed() {
  info('Rodando seeders...')
  try {
    await Connection.connect()
    success('Seeders executados com sucesso!')
    await Connection.disconnect()
  } catch (err: any) {
    error(`Falha: ${err.message}`)
    process.exit(1)
  }
}
