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
  return `import { ${name}Repository } from '../repositories/${name}Repository'

export class ${name}Service {
  constructor(private ${name.toLowerCase()}Repository: ${name}Repository) {}

  findAll()                                     { return this.${name.toLowerCase()}Repository.findAll() }
  findById(id: string)                          { return this.${name.toLowerCase()}Repository.findById(id) }
  create(data: Record<string, any>)             { return this.${name.toLowerCase()}Repository.create(data) }
  update(id: string, data: Record<string, any>) { return this.${name.toLowerCase()}Repository.update(id, data) }
  delete(id: string)                            { return this.${name.toLowerCase()}Repository.delete(id) }
}
`
}

export function makeService(name: string) {
  const src = path.resolve(process.cwd(), 'src')
  writeFile(path.join(src, 'services', `${name}Service.ts`), stub(name))
}