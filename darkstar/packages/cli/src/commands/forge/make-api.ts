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

function pluralize(word: string): string {
  if (word.endsWith('ch') || word.endsWith('sh') || word.endsWith('x') || word.endsWith('z') || word.endsWith('s')) {
    return word + 'es'
  }
  if (word.endsWith('y') && !['ay', 'ey', 'iy', 'oy', 'uy'].some(v => word.endsWith(v))) {
    return word.slice(0, -1) + 'ies'
  }
  return word + 's'
}

function controllerStub(name: string): string {
  const lower = name.toLowerCase()
  return `import { DarkstarRequest, DarkstarResponse } from '@darkstar/core'
import { ${name}Service } from '../services/${name}Service'

export class ${name}Controller {
  constructor(private ${lower}Service: ${name}Service) {}

  async index(req: DarkstarRequest, res: DarkstarResponse) {
    const data = await this.${lower}Service.findAll()
    return res.ok(data)
  }

  async show(req: DarkstarRequest, res: DarkstarResponse) {
    const data = await this.${lower}Service.findById(req.param('id')!)
    if (!data) return res.notFound('${name} não encontrado')
    return res.ok(data)
  }

  async store(req: DarkstarRequest, res: DarkstarResponse) {
    const data = await this.${lower}Service.create(req.all())
    return res.created(data)
  }

  async update(req: DarkstarRequest, res: DarkstarResponse) {
    const data = await this.${lower}Service.update(req.param('id')!, req.all())
    return res.ok(data)
  }

  async destroy(req: DarkstarRequest, res: DarkstarResponse) {
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
  const table = pluralize(name.toLowerCase())
  return `import { Model } from '@darkstar/orm'

export class ${name} extends Model {
  static table = '${table}'
}
`
}

function routeStub(name: string): string {
  const lower = name.toLowerCase()
  const plural = pluralize(lower)
  return `import { Route, Container } from '@darkstar/core'
import { ${name}Controller } from '../controllers/${name}Controller'
import { ${name}Service } from '../services/${name}Service'
import { ${name}Repository } from '../repositories/${name}Repository'

Container.bind('${name}Repository', ${name}Repository)
Container.bind('${name}Service',    ${name}Service)
Container.bind('${name}Controller', ${name}Controller)

Route.resource('${plural}', ${name}Controller)
`
}

function schemaStub(name: string): string {
  return `export const ${name}Schema = {}
`
}

function middlewareStub(name: string): string {
  return `import { DarkstarRequest, DarkstarResponse, NextFunction } from '@darkstar/core'

export class ${name}Middleware {
  handle(req: DarkstarRequest, res: DarkstarResponse, next: NextFunction) {
    next()
  }
}
`
}

function omitPasswordStub(name: string): string {
  return `export function omit${name}Password<T extends Record<string, any>>(obj: T): Omit<T, 'password'> {
  const { password, ...rest } = obj
  return rest
}
`
}

function twoFactorStub(name: string): string {
  return `import * as crypto from 'crypto'

/**
 * Gera um código TOTP simples de 6 dígitos para ${name}.
 * Em produção, prefira libs como 'otplib' para TOTP compliant com RFC 6238.
 */
export function generate${name}TwoFactorCode(): string {
  const code = crypto.randomInt(100000, 999999)
  return code.toString()
}

/**
 * Valida se o código informado corresponde ao código esperado para ${name}.
 */
export function validate${name}TwoFactorCode(inputCode: string, expectedCode: string): boolean {
  return inputCode.trim() === expectedCode.trim()
}
`
}

function registerRoute(src: string, lower: string) {
  const appPath = path.join(src, 'core', 'app.ts')
  if (!fs.existsSync(appPath)) return

  const plural = pluralize(lower)
  let content = fs.readFileSync(appPath, 'utf-8')
  const routeImport = `import '../routes/${plural}'`

  if (content.includes(routeImport)) return

  content = content.replace(
    /(import\s+.*\n)(?!import)/,
    `$1${routeImport}\n`
  )

  fs.writeFileSync(appPath, content, 'utf-8')
  success(`Rota registrada em src/core/app.ts`)
}

export function makeApi(name: string) {
  const src = path.resolve(process.cwd(), 'src')
  const lower = name.toLowerCase()
  const plural = pluralize(lower)

  console.log('')
  info(`Gerando camada completa para: ${kleur.magenta(name)}`)
  console.log('')

  writeFile(path.join(src, 'controllers',  `${name}Controller.ts`),  controllerStub(name))
  writeFile(path.join(src, 'services',     `${name}Service.ts`),     serviceStub(name))
  writeFile(path.join(src, 'repositories', `${name}Repository.ts`),  repositoryStub(name))
  writeFile(path.join(src, 'models',       `${name}.ts`),            modelStub(name))
  writeFile(path.join(src, 'routes',       `${plural}.ts`),          routeStub(name))
  writeFile(path.join(src, 'schemas',      `${name}Schema.ts`),      schemaStub(name))
  writeFile(path.join(src, 'middlewares',  `${name}Middleware.ts`),  middlewareStub(name))

  registerRoute(src, lower)

  console.log('')
  success(`API ${name} gerada com sucesso!`)
  console.log('')
}

export function makeUtil(name: string) {
  const src = path.resolve(process.cwd(), 'src')
  const lower = name.toLowerCase()

  console.log('')
  info(`Gerando utils para: ${kleur.magenta(name)}`)
  console.log('')

  writeFile(path.join(src, 'utils', lower, `omitPassword.ts`), omitPasswordStub(name))
  writeFile(path.join(src, 'utils', lower, `twoFactor.ts`),    twoFactorStub(name))

  console.log('')
  success(`Utils de ${name} geradas com sucesso!`)
  console.log('')
}

export function makeSchema(name: string) {
  const src = path.resolve(process.cwd(), 'src')

  console.log('')
  info(`Gerando schema para: ${kleur.magenta(name)}`)
  console.log('')

  writeFile(path.join(src, 'schemas', `${name}Schema.ts`), schemaStub(name))

  console.log('')
  success(`Schema ${name} gerado com sucesso!`)
  console.log('')
}

export function makeMiddleware(name: string) {
  const src = path.resolve(process.cwd(), 'src')

  console.log('')
  info(`Gerando middleware para: ${kleur.magenta(name)}`)
  console.log('')

  writeFile(path.join(src, 'middlewares', `${name}Middleware.ts`), middlewareStub(name))

  console.log('')
  success(`Middleware ${name} gerado com sucesso!`)
  console.log('')
}