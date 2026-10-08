import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

// -----------------------------------------------
// Helpers
// -----------------------------------------------

function makeTmpDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'darkstar-cli-'))
  fs.mkdirSync(path.join(dir, 'src', 'controllers'), { recursive: true })
  fs.mkdirSync(path.join(dir, 'src', 'core'),        { recursive: true })
  fs.mkdirSync(path.join(dir, 'database', 'seeders'), { recursive: true })
  return dir
}

function makeDatabaseSeeder(dir: string) {
  fs.writeFileSync(
    path.join(dir, 'database', 'seeders', 'DatabaseSeeder.ts'),
    `export class DatabaseSeeder {\n  seeders = [\n    // registre seus seeders aqui\n  ]\n}\n`
  )
}

// -----------------------------------------------
// make-controller
// -----------------------------------------------

describe('makeController()', () => {
  let tmpDir: string

  beforeEach(() => { tmpDir = makeTmpDir() })
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }) })

  it('cria o arquivo do controller', async () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    const { makeController } = await import('../packages/cli/src/commands/forge/make-controller')
    makeController('Product')
    cwdSpy.mockRestore()

    const file = path.join(tmpDir, 'src', 'controllers', 'ProductController.ts')
    expect(fs.existsSync(file)).toBe(true)
  })

  it('controller gerado contém a classe e o import do Service', async () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    const { makeController } = await import('../packages/cli/src/commands/forge/make-controller')
    makeController('Order')
    cwdSpy.mockRestore()

    const content = fs.readFileSync(
      path.join(tmpDir, 'src', 'controllers', 'OrderController.ts'), 'utf-8'
    )
    expect(content).toContain('class OrderController')
    expect(content).toContain("import { OrderService } from '../services/OrderService'")
  })

  it('não sobrescreve controller existente', async () => {
    const filePath = path.join(tmpDir, 'src', 'controllers', 'UserController.ts')
    fs.writeFileSync(filePath, '// original')

    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    const { makeController } = await import('../packages/cli/src/commands/forge/make-controller')
    makeController('User')
    cwdSpy.mockRestore()

    expect(fs.readFileSync(filePath, 'utf-8')).toBe('// original')
  })
})

// -----------------------------------------------
// make-migration
// -----------------------------------------------

describe('makeMigration()', () => {
  let tmpDir: string

  beforeEach(() => { tmpDir = makeTmpDir() })
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }) })

  it('cria arquivo de migration com timestamp no nome', async () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    const { makeMigration } = await import('../packages/cli/src/commands/forge/make-migration')
    makeMigration('create_users_table')
    cwdSpy.mockRestore()

    const files = fs.readdirSync(path.join(tmpDir, 'database', 'migrations'))
    expect(files).toHaveLength(1)
    expect(files[0]).toMatch(/^\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2}_create_users_table\.ts$/)
  })

  it('migration gerada exporta up() e down()', async () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    const { makeMigration } = await import('../packages/cli/src/commands/forge/make-migration')
    makeMigration('create_products_table')
    cwdSpy.mockRestore()

    const files = fs.readdirSync(path.join(tmpDir, 'database', 'migrations'))
    const content = fs.readFileSync(
      path.join(tmpDir, 'database', 'migrations', files[0]), 'utf-8'
    )
    expect(content).toContain('export async function up')
    expect(content).toContain('export async function down')
  })

  it('migration extrai o nome da tabela corretamente de create_X_table', async () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    const { makeMigration } = await import('../packages/cli/src/commands/forge/make-migration')
    makeMigration('create_orders_table')
    cwdSpy.mockRestore()

    const files = fs.readdirSync(path.join(tmpDir, 'database', 'migrations'))
    const content = fs.readFileSync(
      path.join(tmpDir, 'database', 'migrations', files[0]), 'utf-8'
    )
    expect(content).toContain("schema.create('orders'")
    expect(content).toContain("schema.drop('orders'")
  })

  it('migration cria a pasta database/migrations se não existir', async () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    fs.rmSync(path.join(tmpDir, 'database'), { recursive: true, force: true })

    const { makeMigration } = await import('../packages/cli/src/commands/forge/make-migration')
    makeMigration('create_logs_table')
    cwdSpy.mockRestore()

    expect(fs.existsSync(path.join(tmpDir, 'database', 'migrations'))).toBe(true)
  })
})

// -----------------------------------------------
// make-seeder
// -----------------------------------------------

describe('makeSeeder()', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = makeTmpDir()
    makeDatabaseSeeder(tmpDir)
  })
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }) })

  it('cria o arquivo do seeder', async () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    const { makeSeeder } = await import('../packages/cli/src/commands/forge/make-seeder')
    makeSeeder('Category')
    cwdSpy.mockRestore()

    const file = path.join(tmpDir, 'database', 'seeders', 'CategorySeeder.ts')
    expect(fs.existsSync(file)).toBe(true)
  })

  it('seeder gerado contém a classe e o import do Model', async () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    const { makeSeeder } = await import('../packages/cli/src/commands/forge/make-seeder')
    makeSeeder('Category')
    cwdSpy.mockRestore()

    const content = fs.readFileSync(
      path.join(tmpDir, 'database', 'seeders', 'CategorySeeder.ts'), 'utf-8'
    )
    expect(content).toContain('class CategorySeeder')
    expect(content).toContain("import { Category } from '../../src/models/Category'")
    expect(content).toContain('async run()')
  })

  it('seeder User usa o stub especial com bcrypt', async () => {
  const migrationsDir = path.join(tmpDir, 'database', 'migrations')
  fs.mkdirSync(migrationsDir, { recursive: true })
  fs.writeFileSync(
    path.join(migrationsDir, '2026_01_01_00_00_00_create_users_table.ts'),
    `await schema.create('users', (table) => {
      table.string('name')
      table.string('email').unique()
      table.string('password')
      table.string('role')
    })`
  )

  const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
  const { makeSeeder } = await import('../packages/cli/src/commands/forge/make-seeder')
  makeSeeder('User')
  cwdSpy.mockRestore()

  const content = fs.readFileSync(
    path.join(tmpDir, 'database', 'seeders', 'UserSeeder.ts'), 'utf-8'
  )
  expect(content).toContain('bcrypt')
  expect(content).toContain('role')
})

  it('registra o seeder no DatabaseSeeder.ts', async () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    const { makeSeeder } = await import('../packages/cli/src/commands/forge/make-seeder')
    makeSeeder('Product')
    cwdSpy.mockRestore()

    const content = fs.readFileSync(
      path.join(tmpDir, 'database', 'seeders', 'DatabaseSeeder.ts'), 'utf-8'
    )
    expect(content).toContain("import { ProductSeeder } from './ProductSeeder'")
    expect(content).toContain('new ProductSeeder()')
  })

  it('não registra seeder duplicado no DatabaseSeeder', async () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    const { makeSeeder } = await import('../packages/cli/src/commands/forge/make-seeder')
    makeSeeder('Product')

    // roda de novo — não deve duplicar o import
    fs.rmSync(path.join(tmpDir, 'database', 'seeders', 'ProductSeeder.ts'))
    makeSeeder('Product')
    cwdSpy.mockRestore()

    const content = fs.readFileSync(
      path.join(tmpDir, 'database', 'seeders', 'DatabaseSeeder.ts'), 'utf-8'
    )
    const matches = content.match(/import \{ ProductSeeder \}/g) ?? []
    expect(matches).toHaveLength(1)
  })
})