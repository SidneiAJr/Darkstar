import kleur from 'kleur'
import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

function success(msg: string) { console.log(kleur.green('  ✔ ') + msg) }
function info(msg: string)    { console.log(kleur.cyan('  → ') + msg) }
function error(msg: string)   { console.log(kleur.red('  ✘ ') + msg) }

export async function dbSeed() {
  info('Rodando seeders...')

  const seederPath = path.resolve(process.cwd(), 'database/seeders/DatabaseSeeder.ts')

  if (!fs.existsSync(seederPath)) {
    error('DatabaseSeeder.ts não encontrado em database/seeders/')
    process.exit(1)
  }

  // Usa o tsx LOCAL do projeto — não o npx, que resolve qualquer um do PATH
  const tsxLocal = path.resolve(process.cwd(), 'node_modules/.bin/tsx')

  if (!fs.existsSync(tsxLocal)) {
    error('tsx não encontrado. Rode: npm install -D tsx')
    process.exit(1)
  }

  try {
    execSync(`"${tsxLocal}" "${seederPath}"`, { stdio: 'inherit' })
    success('Seeders executados com sucesso!')
  } catch (err: any) {
    error(`Falha: ${err.message}`)
    process.exit(1)
  }
}