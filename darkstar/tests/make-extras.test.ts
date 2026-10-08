import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

// -----------------------------------------------
// Helper
// -----------------------------------------------

function makeTmpDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'darkstar-cli-'))
  fs.mkdirSync(path.join(dir, 'src', 'models'),      { recursive: true })
  fs.mkdirSync(path.join(dir, 'src', 'services'),    { recursive: true })
  fs.mkdirSync(path.join(dir, 'src', 'middlewares'), { recursive: true })
  fs.mkdirSync(path.join(dir, 'src', 'repositories'), { recursive: true })
  fs.mkdirSync(path.join(dir, 'src', 'schemas'),     { recursive: true })
  fs.mkdirSync(path.join(dir, 'src', 'utils'),       { recursive: true })
  return dir
}

// -----------------------------------------------
// make:model
// -----------------------------------------------

describe('makeModel()', () => {
  let tmpDir: string

  beforeEach(() => { tmpDir = makeTmpDir() })
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }) })

  it('cria o arquivo do model', async () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    const { makeModel } = await import('../packages/cli/src/commands/forge/make-model')
    makeModel('Product')
    cwdSpy.mockRestore()

    const file = path.join(tmpDir, 'src', 'models', 'Product.ts')
    expect(fs.existsSync(file)).toBe(true)
  })

  it('model gerado extende Model e define a tabela', async () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    const { makeModel } = await import('../packages/cli/src/commands/forge/make-model')
    makeModel('Product')
    cwdSpy.mockRestore()

    const content = fs.readFileSync(
      path.join(tmpDir, 'src', 'models', 'Product.ts'), 'utf-8'
    )
    expect(content).toContain('class Product')
    expect(content).toContain('extends Model')
    expect(content).toContain("static table = 'products'")
  })

  it('model importa Model base', async () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    const { makeModel } = await import('../packages/cli/src/commands/forge/make-model')
    makeModel('Category')
    cwdSpy.mockRestore()

    const content = fs.readFileSync(
      path.join(tmpDir, 'src', 'models', 'Category.ts'), 'utf-8'
    )
    expect(content).toContain('import')
    expect(content).toContain('Model')
  })

  it('não sobrescreve model existente', async () => {
    const filePath = path.join(tmpDir, 'src', 'models', 'User.ts')
    fs.writeFileSync(filePath, '// original')

    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    const { makeModel } = await import('../packages/cli/src/commands/forge/make-model')
    makeModel('User')
    cwdSpy.mockRestore()

    expect(fs.readFileSync(filePath, 'utf-8')).toBe('// original')
  })
})

// -----------------------------------------------
// make:service
// -----------------------------------------------

describe('makeService()', () => {
  let tmpDir: string

  beforeEach(() => { tmpDir = makeTmpDir() })
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }) })

  it('cria o arquivo do service', async () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    const { makeService } = await import('../packages/cli/src/commands/forge/make-service')
    makeService('Order')
    cwdSpy.mockRestore()

    const file = path.join(tmpDir, 'src', 'services', 'OrderService.ts')
    expect(fs.existsSync(file)).toBe(true)
  })

  it('service gerado contém a classe e importa o Repository', async () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    const { makeService } = await import('../packages/cli/src/commands/forge/make-service')
    makeService('Order')
    cwdSpy.mockRestore()

    const content = fs.readFileSync(
      path.join(tmpDir, 'src', 'services', 'OrderService.ts'), 'utf-8'
    )
    expect(content).toContain('class OrderService')
    expect(content).toContain("import { OrderRepository } from '../repositories/OrderRepository'")
  })

  it('não sobrescreve service existente', async () => {
    const filePath = path.join(tmpDir, 'src', 'services', 'UserService.ts')
    fs.writeFileSync(filePath, '// original')

    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    const { makeService } = await import('../packages/cli/src/commands/forge/make-service')
    makeService('User')
    cwdSpy.mockRestore()

    expect(fs.readFileSync(filePath, 'utf-8')).toBe('// original')
  })
})

// -----------------------------------------------
// make:middleware
// -----------------------------------------------

describe('makeMiddleware()', () => {
  let tmpDir: string

  beforeEach(() => { tmpDir = makeTmpDir() })
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }) })

  it('cria o arquivo do middleware', async () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    const { makeMiddleware } = await import('../packages/cli/src/commands/forge/make-middleware')
    makeMiddleware('Auth')
    cwdSpy.mockRestore()

    const file = path.join(tmpDir, 'src', 'middlewares', 'AuthMiddleware.ts')
    expect(fs.existsSync(file)).toBe(true)
  })

  it('middleware gerado exporta uma função com (req, res, next)', async () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    const { makeMiddleware } = await import('../packages/cli/src/commands/forge/make-middleware')
    makeMiddleware('Auth')
    cwdSpy.mockRestore()

    const content = fs.readFileSync(
      path.join(tmpDir, 'src', 'middlewares', 'AuthMiddleware.ts'), 'utf-8'
    )
    expect(content).toContain('AuthMiddleware')
    expect(content).toContain('req')
    expect(content).toContain('res')
    expect(content).toContain('next')
  })

  it('não sobrescreve middleware existente', async () => {
    const filePath = path.join(tmpDir, 'src', 'middlewares', 'AuthMiddleware.ts')
    fs.writeFileSync(filePath, '// original')

    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    const { makeMiddleware } = await import('../packages/cli/src/commands/forge/make-middleware')
    makeMiddleware('Auth')
    cwdSpy.mockRestore()

    expect(fs.readFileSync(filePath, 'utf-8')).toBe('// original')
  })
})

// -----------------------------------------------
// make:repository
// -----------------------------------------------

describe('makeRepository()', () => {
  let tmpDir: string

  beforeEach(() => { tmpDir = makeTmpDir() })
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }) })

  it('cria o arquivo do repository', async () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    const { makeRepository } = await import('../packages/cli/src/commands/forge/make-repository')
    makeRepository('Product')
    cwdSpy.mockRestore()

    const file = path.join(tmpDir, 'src', 'repositories', 'ProductRepository.ts')
    expect(fs.existsSync(file)).toBe(true)
  })

  it('repository gerado importa o Model correto', async () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    const { makeRepository } = await import('../packages/cli/src/commands/forge/make-repository')
    makeRepository('Product')
    cwdSpy.mockRestore()

    const content = fs.readFileSync(
      path.join(tmpDir, 'src', 'repositories', 'ProductRepository.ts'), 'utf-8'
    )
    expect(content).toContain('class ProductRepository')
    expect(content).toContain("import { Product } from '../models/Product'")
  })
})

// -----------------------------------------------
// make:schema
// -----------------------------------------------

describe('makeSchema()', () => {
  let tmpDir: string

  beforeEach(() => { tmpDir = makeTmpDir() })
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }) })

  it('cria o arquivo do schema', async () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    const { makeSchema } = await import('../packages/cli/src/commands/forge/make-schema')
    makeSchema('Product')
    cwdSpy.mockRestore()

    const file = path.join(tmpDir, 'src', 'schemas', 'ProductSchema.ts')
    expect(fs.existsSync(file)).toBe(true)
  })
})

// -----------------------------------------------
// make:util
// -----------------------------------------------

describe('makeUtil()', () => {
  let tmpDir: string

  beforeEach(() => { tmpDir = makeTmpDir() })
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }) })

  it('cria os arquivos do util', async () => {
  const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
  const { makeUtil } = await import('../packages/cli/src/commands/forge/make-util')
  makeUtil('DateHelper')
  cwdSpy.mockRestore()

  const twoFactor = path.join(tmpDir, 'src', 'utils', 'datehelper', 'twoFactor.ts')
  expect(fs.existsSync(twoFactor)).toBe(true)
})
})