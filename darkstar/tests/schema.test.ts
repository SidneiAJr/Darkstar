import { describe, it, expect, vi } from 'vitest'
import { Schema } from '../packages/orm/src/schema'
import type { BaseDriver } from '../packages/orm/src/drivers/base-driver'

function makeDriver(rows: any[] = []): BaseDriver {
  return {
    connect:    vi.fn(),
    disconnect: vi.fn(),
    ping:       vi.fn().mockResolvedValue(true),
    type:       vi.fn().mockReturnValue('mysql'),
    query:      vi.fn().mockResolvedValue({ rows, affectedRows: 0 }),
  } as unknown as BaseDriver
}

describe('Schema — create()', () => {
  it('gera CREATE TABLE com id e timestamps', async () => {
    const driver = makeDriver()
    const schema = new Schema(driver)

    await schema.create('users', (table) => {
      table.id()
      table.string('name')
      table.timestamps()
    })

    const sql = (driver.query as any).mock.calls[0][0] as string
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS `users`')
    expect(sql).toContain('`id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT')
    expect(sql).toContain('`name` VARCHAR(255) NOT NULL')
    expect(sql).toContain('`created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP')
    expect(sql).toContain('PRIMARY KEY (`id`)')
    expect(sql).toContain('ENGINE=InnoDB')
  })

  it('gera UNIQUE KEY para coluna unique', async () => {
    const driver = makeDriver()
    const schema = new Schema(driver)

    await schema.create('users', (table) => {
      table.id()
      table.string('email').unique()
    })

    const sql = (driver.query as any).mock.calls[0][0] as string
    expect(sql).toContain('UNIQUE KEY `users_email_unique` (`email`)')
  })

  it('gera coluna nullable corretamente', async () => {
    const driver = makeDriver()
    const schema = new Schema(driver)

    await schema.create('posts', (table) => {
      table.id()
      table.string('subtitle').nullable()
    })

    const sql = (driver.query as any).mock.calls[0][0] as string
    expect(sql).toContain('`subtitle` VARCHAR(255) NULL')
  })

  it('gera FOREIGN KEY com CONSTRAINT', async () => {
    const driver = makeDriver()
    const schema = new Schema(driver)

    await schema.create('posts', (table) => {
      table.id()
      table.foreignId('user_id').references('id').on('users')
    })

    const sql = (driver.query as any).mock.calls[0][0] as string
    expect(sql).toContain('CONSTRAINT `fk_posts_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)')
  })

  it('gera DEFAULT para coluna com valor padrão string', async () => {
    const driver = makeDriver()
    const schema = new Schema(driver)

    await schema.create('users', (table) => {
      table.id()
      table.string('role').default('user')
    })

    const sql = (driver.query as any).mock.calls[0][0] as string
    expect(sql).toContain("DEFAULT 'user'")
  })

  it('gera DEFAULT para coluna com valor padrão numérico', async () => {
    const driver = makeDriver()
    const schema = new Schema(driver)

    await schema.create('products', (table) => {
      table.id()
      table.integer('stock').default(0)
    })

    const sql = (driver.query as any).mock.calls[0][0] as string
    expect(sql).toContain('DEFAULT 0')
  })

  it('gera softDeletes como TIMESTAMP NULL', async () => {
    const driver = makeDriver()
    const schema = new Schema(driver)

    await schema.create('users', (table) => {
      table.id()
      table.softDeletes()
    })

    const sql = (driver.query as any).mock.calls[0][0] as string
    expect(sql).toContain('`deleted_at` TIMESTAMP NULL')
  })
})

describe('Schema — outros métodos', () => {
  it('drop() executa DROP TABLE IF EXISTS', async () => {
    const driver = makeDriver()
    const schema = new Schema(driver)

    await schema.drop('users')
    expect(driver.query).toHaveBeenCalledWith('DROP TABLE IF EXISTS `users`')
  })

  it('hasTable() retorna true quando tabela existe', async () => {
    const driver = makeDriver([{ Tables_in_db: 'users' }])
    const schema = new Schema(driver)

    const result = await schema.hasTable('users')
    expect(result).toBe(true)
  })

  it('hasTable() retorna false quando tabela não existe', async () => {
    const driver = makeDriver([])
    const schema = new Schema(driver)

    const result = await schema.hasTable('users')
    expect(result).toBe(false)
  })

  it('addColumn() executa ALTER TABLE ADD COLUMN', async () => {
    const driver = makeDriver()
    const schema = new Schema(driver)

    await schema.addColumn('users', (table) => {
      table.string('phone')
    })

    const sql = (driver.query as any).mock.calls[0][0] as string
    expect(sql).toContain('ALTER TABLE `users` ADD COLUMN')
    expect(sql).toContain('`phone`')
  })

  it('dropColumn() executa ALTER TABLE DROP COLUMN', async () => {
    const driver = makeDriver()
    const schema = new Schema(driver)

    await schema.dropColumn('users', 'phone')
    expect(driver.query).toHaveBeenCalledWith('ALTER TABLE `users` DROP COLUMN `phone`')
  })
})