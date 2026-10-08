import kleur from 'kleur'
import path from 'path'
import { execSync } from 'child_process'

function success(msg: string) { console.log(kleur.green('  ✔ ') + msg) }
function info(msg: string)    { console.log(kleur.cyan('  → ') + msg) }
function error(msg: string)   { console.log(kleur.red('  ✘ ') + msg) }

export async function dbSeed() {
  info('Rodando seeders...')
  try {
    const seederPath = path.resolve(process.cwd(), 'database/seeders/DatabaseSeeder.ts')
    execSync(`npx tsx ${seederPath}`, { stdio: 'inherit' })
    success('Seeders executados com sucesso!')
  } catch (err: any) {
    error(`Falha: ${err.message}`)
    process.exit(1)
  }
}