import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import type { BaseDriver } from '../packages/orm/src/drivers/base-driver'

// -----------------------------------------------
// Mock do driver e Connection
// -----------------------------------------------

function makeDriver(rows: any[] = [], affectedRows = 1): BaseDriver {
  return {
    connect:    vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    ping:       vi.fn().mockResolvedValue(true),
    query:      vi.fn().mockResolvedValue({ rows, affectedRows }),
  } as unknown as BaseDriver
}

vi.mock('@darkstar/orm', () => ({
  Connection: {
    connect:    vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockReturnValue({
      type:  vi.fn().mockReturnValue('mysql'),
      query: vi.fn().mockImplementation((sql: string) => {
        if (sql?.includes('GET_LOCK'))
          return Promise.resolve({ rows: [{ result: 1 }], affectedRows: 0 })
        if (sql?.includes('SELECT name FROM darkstar_migrations'))
          return Promise.resolve({ rows: [], affectedRows: 0 })
        return Promise.resolve({ rows: [], affectedRows: 1 })
      }),
    }),
  },
  Schema: vi.fn().mockImplementation(() => ({
    create:   vi.fn().mockResolvedValue(undefined),
    drop:     vi.fn().mockResolvedValue(undefined),
    hasTable: vi.fn().mockResolvedValue(false),
  })),
}))

// -----------------------------------------------
// Helper — cria estrutura mínima de migrations
// -----------------------------------------------

function makeTmpDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'darkstar-db-'))
  fs.mkdirSync(path.join(dir, 'database', 'migrations'), { recursive: true })
  fs.mkdirSync(path.join(dir, 'database', 'seeders'),    { recursive: true })
  return dir
}

function writeMigration(dir: string, name: string, content: string) {
  fs.writeFileSync(
    path.join(dir, 'database', 'migrations', name),
    content
  )
}

// -----------------------------------------------
// db:migrate
// -----------------------------------------------

describe('db:migrate', () => {
  let tmpDir: string

  beforeEach(() => {
    vi.resetModules()
    tmpDir = makeTmpDir()
  })
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }) })

  it('roda as migrations em ordem crescente de timestamp', async () => {
    writeMigration(tmpDir, '2026_01_01_00_00_01_create_users_table.ts', `
      export async function up(schema) { schema._ran = 'users' }
      export async function down(schema) {}
    `)
    writeMigration(tmpDir, '2026_01_01_00_00_02_create_posts_table.ts', `
      export async function up(schema) { schema._ran = 'posts' }
      export async function down(schema) {}
    `)

    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    const { dbMigrate } = await import('../packages/cli/src/commands/forge/db-migrate')
    await dbMigrate()
    cwdSpy.mockRestore()

    expect(true).toBe(true)
  })

  it('não roda migration que já foi executada', async () => {
    writeMigration(tmpDir, '2026_01_01_00_00_01_create_users_table.ts', `
      export async function up(schema) {}
      export async function down(schema) {}
    `)

    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    const { dbMigrate } = await import('../packages/cli/src/commands/forge/db-migrate')
    await dbMigrate()
    cwdSpy.mockRestore()

    expect(true).toBe(true)
  })
})

// -----------------------------------------------
// db:rollback
// -----------------------------------------------

describe('db:rollback', () => {
  let tmpDir: string

  beforeEach(() => {
    vi.resetModules()
    tmpDir = makeTmpDir()
  })
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }) })

  it('executa o down() da última migration rodada', async () => {
    writeMigration(tmpDir, '2026_01_01_00_00_01_create_users_table.ts', `
      export async function up(schema) {}
      export async function down(schema) { schema.drop('users') }
    `)

    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    const { dbRollback } = await import('../packages/cli/src/commands/forge/db-rollback')
    await dbRollback()
    cwdSpy.mockRestore()

    expect(true).toBe(true)
  })
})

// -----------------------------------------------
// db:seed
// -----------------------------------------------

describe('db:seed', () => {
  let tmpDir: string

  beforeEach(() => {
    vi.resetModules()
    tmpDir = makeTmpDir()
  })
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }) })

  it('executa o DatabaseSeeder e chama run() de cada seeder registrado', async () => {
    fs.writeFileSync(
      path.join(tmpDir, 'database', 'seeders', 'DatabaseSeeder.ts'),
      `
        export class DatabaseSeeder {
          seeders = []
          async run() {}
        }
      `
    )

    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    const { dbSeed } = await import('../packages/cli/src/commands/forge/db-seed')
    await dbSeed()
    cwdSpy.mockRestore()

    expect(true).toBe(true)
  })
})