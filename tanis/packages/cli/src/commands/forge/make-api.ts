import kleur from 'kleur'
import * as fs from 'fs'
import * as path from 'path'

function success(msg: string) { console.log(kleur.green('  ✔ ') + msg) }
function info(msg: string)    { console.log(kleur.cyan('  → ') + msg) }
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

function controllerStub(name: string): string {
  const lower = name.toLowerCase()
  return `import { TanisRequest, TanisResponse } from '@tanis/core'
import { ${name}Service } from '../services/${name}Service'

export class ${name}Controller {
  constructor(private ${lower}Service: ${name}Service) {}

  async index(req: TanisRequest, res: TanisResponse) {
    const data = await this.${lower}Service.findAll()
    return res.ok(data)
  }

  async show(req: TanisRequest, res: TanisResponse) {
    const data = await this.${lower}Service.findById(req.param('id')!)
    if (!data) return res.notFound('${name} não encontrado')
    return res.ok(data)
  }

  async store(req: TanisRequest, res: TanisResponse) {
    const data = await this.${lower}Service.create(req.all())
    return res.created(data)
  }

  async update(req: TanisRequest, res: TanisResponse) {
    const data = await this.${lower}Service.update(req.param('id')!, req.all())
    return res.ok(data)
  }

  async destroy(req: TanisRequest, res: TanisResponse) {
    await this.${lower}Service.delete(req.param('id')!)
    return res.noContent()
  }
}
`
}

function serviceStub(name: string): string {
  const lower = name.toLowerCase()
  return `import { ${name}Repository } from '../repositories/${name}Repository'

export class ${name}Service {
  constructor(private ${lower}Repository: ${name}Repository) {}

  findAll()                                     { return this.${lower}Repository.findAll() }
  findById(id: string)                          { return this.${lower}Repository.findById(id) }
  create(data: Record<string, any>)             { return this.${lower}Repository.create(data) }
  update(id: string, data: Record<string, any>) { return this.${lower}Repository.update(id, data) }
  delete(id: string)                            { return this.${lower}Repository.delete(id) }
}
`
}

function repositoryStub(name: string): string {
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

function modelStub(name: string): string {
  const table = name.toLowerCase() + 's'
  return `import { Model } from '@tanis/orm'

export class ${name} extends Model {
  static table = '${table}'
}
`
}

function routeStub(name: string): string {
  const lower = name.toLowerCase()
  return `import { Route, Container } from '@tanis/core'
import { ${name}Controller } from '../controllers/${name}Controller'
import { ${name}Service } from '../services/${name}Service'
import { ${name}Repository } from '../repositories/${name}Repository'

Container.bind('${name}Repository', ${name}Repository)
Container.bind('${name}Service',    ${name}Service)
Container.bind('${name}Controller', ${name}Controller)

Route.resource('${lower}s', ${name}Controller)
`
}

export function makeApi(name: string) {
  const src = path.resolve(process.cwd(), 'src')
   const lower = name.toLowerCase()

  console.log('')
  info(`Gerando camada completa para: ${kleur.magenta(name)}`)
  console.log('')

  writeFile(path.join(src, 'controllers',  `${name}Controller.ts`), controllerStub(name))
  writeFile(path.join(src, 'services',     `${name}Service.ts`),    serviceStub(name))
  writeFile(path.join(src, 'repositories', `${name}Repository.ts`), repositoryStub(name))
  writeFile(path.join(src, 'models',       `${name}.ts`),           modelStub(name))
  writeFile(path.join(src, 'routes',       `${lower}s.ts`),         routeStub(name))

  console.log('')
  success(`API ${name} gerada com sucesso!`)
  console.log('')
  console.log(kleur.gray('  Registre a rota no seu arquivo principal:'))
  console.log(kleur.cyan(`  import './routes/${name.toLowerCase()}s'`))
  console.log('')
}