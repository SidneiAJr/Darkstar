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

function stub(name: string): string {
  const table = name.toLowerCase() + 's'
  return `import { createModel, Model } from '@darkstar-cli/orm'

class ${name}Model extends Model {
  static table = '${table}'
}

export const ${name} = createModel(${name}Model)
`
}

export function makeModel(name: string) {
  const src = path.resolve(process.cwd(), 'src')
  writeFile(path.join(src, 'models', `${name}.ts`), stub(name))
}