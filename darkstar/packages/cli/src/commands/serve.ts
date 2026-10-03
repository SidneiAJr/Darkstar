import kleur from 'kleur'
import { execSync } from 'child_process'

function info(msg: string)  { console.log(kleur.cyan('  → ') + msg) }
function error(msg: string) { console.log(kleur.red('  ✘ ') + msg) }

export function runServe() {
  info('Iniciando servidor Darkstar...')
  try {
    execSync('npm run dev', { stdio: 'inherit' })
  } catch {
    error('Falha ao subir o servidor.')
  }
}