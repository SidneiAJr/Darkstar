import kleur from 'kleur'
import * as fs from 'fs'
import * as path from 'path'

function success(msg: string) { console.log(kleur.green('  ✔ ') + msg) }
function error(msg: string)   { console.log(kleur.red('  ✘ ') + msg) }

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true })
}

function writeFile(filePath: string, content: string) {
  if (fs.existsSync(filePath)) { error(`Arquivo já existe: ${filePath}`); return }
  ensureDir(path.dirname(filePath))
  fs.writeFileSync(filePath, content, 'utf-8')
  success(`Criado: ${filePath}`)
}

function pluralize(word: string): string {
  if (word.endsWith('ch') || word.endsWith('sh') || word.endsWith('x') || word.endsWith('z') || word.endsWith('s')) {
    return word + 'es'
  }
  if (word.endsWith('y') && !['ay', 'ey', 'iy', 'oy', 'uy'].some(v => word.endsWith(v))) {
    return word.slice(0, -1) + 'ies'
  }
  return word + 's'
}

function stub(name: string): string {
  const table = pluralize(name.toLowerCase())
  return `import { Model } from '@darkstar-cli/orm'

export class ${name} extends Model {
  static table = '${table}'

  /**
   * Campos que NÃO são retornados nas respostas da API.
   * Equivalente ao $hidden do Laravel.
   */
  static hidden = ['password']
}
`
}

export function makeModel(name: string) {
  const src = path.resolve(process.cwd(), 'src')
  writeFile(path.join(src, 'models', `${name}.ts`), stub(name))
}