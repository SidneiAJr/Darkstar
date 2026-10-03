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
  return `import { DarkstarRequest, DarkstarResponse } from '@darkstar/core'
import { ${name}Service } from '../services/${name}Service'

export class ${name}Controller {
  constructor(private ${name.toLowerCase()}Service: ${name}Service) {}

  async index(req: DarkstarRequest, res: DarkstarResponse) {
    const data = await this.${name.toLowerCase()}Service.findAll()
    return res.ok(data)
  }

  async show(req: DarkstarRequest, res: DarkstarResponse) {
    const data = await this.${name.toLowerCase()}Service.findById(req.param('id')!)
    if (!data) return res.notFound('${name} não encontrado')
    return res.ok(data)
  }

  async store(req: DarkstarRequest, res: DarkstarResponse) {
    const data = await this.${name.toLowerCase()}Service.create(req.all())
    return res.created(data)
  }

  async update(req: DarkstarRequest, res: DarkstarResponse) {
    const data = await this.${name.toLowerCase()}Service.update(req.param('id')!, req.all())
    return res.ok(data)
  }

  async destroy(req: DarkstarRequest, res: DarkstarResponse) {
    await this.${name.toLowerCase()}Service.delete(req.param('id')!)
    return res.noContent()
  }
}
`
}

export function makeController(name: string) {
  const src = path.resolve(process.cwd(), 'src')
  writeFile(path.join(src, 'controllers', `${name}Controller.ts`), stub(name))
}