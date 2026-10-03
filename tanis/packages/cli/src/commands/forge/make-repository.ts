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
  return `import { ${name} } from '../models/${name}'

export class ${name}Repository {
  findAll()                                     { return ${name}.findAll() }
  findById(id: string)                          { return ${name}.findById(id) }
  create(data: Record<string, any>)             { return ${name}.create(data as any) }
  update(id: string, data: Record<string, any>) { return ${name}.update(id, data as any) }
  delete(id: string)                            { return ${name}.delete(id) }
}
`
}

export function makeRepository(name: string) {
  const src = path.resolve(process.cwd(), 'src')
  writeFile(path.join(src, 'repositories', `${name}Repository.ts`), stub(name))
}