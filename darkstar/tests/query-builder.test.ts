import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryBuilder } from '../packages/orm/src/query-builder'
import type { BaseDriver } from '../packages/orm/src/drivers/base-driver'

// -----------------------------------------------
// Mock do BaseDriver
// -----------------------------------------------

function makeDriver(rows: any[] = [], insertId?: number, affectedRows: number = 1): BaseDriver {
  return {
    connect:    vi.fn(),
    disconnect: vi.fn(),
    ping:       vi.fn().mockResolvedValue(true),
    query:      vi.fn().mockResolvedValue({ rows, insertId, affectedRows }),
  } as unknown as BaseDriver
}

// -----------------------------------------------
// QueryBuilder — build de SQL
// -----------------------------------------------

describe('QueryBuilder — toSql()', () => {
  it('SELECT simples', () => {
    const qb = new QueryBuilder(makeDriver(), 'users')
    expect(qb.toSql()).toBe('SELECT * FROM users')
  })

  it('SELECT com where =', () => {
    const qb = new QueryBuilder(makeDriver(), 'users')
    qb.where('role', 'admin')
    expect(qb.toSql()).toBe('SELECT * FROM users WHERE role = "admin"')
  })

  it('SELECT com where operador explícito', () => {
    const qb = new QueryBuilder(makeDriver(), 'users')
    qb.where('age', '>', 18)
    expect(qb.toSql()).toBe('SELECT * FROM users WHERE age > 18')
  })

  it('SELECT com múltiplos wheres (AND)', () => {
    const qb = new QueryBuilder(makeDriver(), 'users')
    qb.where('role', 'admin').where('active', true)
    expect(qb.toSql()).toBe('SELECT * FROM users WHERE role = "admin" AND active = true')
  })

  it('whereIn gera IN (...)', () => {
    const qb = new QueryBuilder(makeDriver(), 'users')
    qb.whereIn('id', [1, 2, 3])
    expect(qb.toSql()).toBe('SELECT * FROM users WHERE id IN (1, 2, 3)')
  })

  it('whereNotIn gera NOT IN (...)', () => {
    const qb = new QueryBuilder(makeDriver(), 'users')
    qb.whereNotIn('id', [4, 5])
    expect(qb.toSql()).toBe('SELECT * FROM users WHERE id NOT IN (4, 5)')
  })

  it('whereLike gera LIKE', () => {
    const qb = new QueryBuilder(makeDriver(), 'users')
    qb.whereLike('name', '%teste%')
    expect(qb.toSql()).toBe('SELECT * FROM users WHERE name LIKE "%teste%"')
  })

  it('orderBy ASC (padrão)', () => {
    const qb = new QueryBuilder(makeDriver(), 'users')
    qb.orderBy('name')
    expect(qb.toSql()).toBe('SELECT * FROM users ORDER BY name ASC')
  })

  it('orderBy DESC', () => {
    const qb = new QueryBuilder(makeDriver(), 'users')
    qb.orderBy('created_at', 'desc')
    expect(qb.toSql()).toBe('SELECT * FROM users ORDER BY created_at DESC')
  })

  it('limit e offset', () => {
    const qb = new QueryBuilder(makeDriver(), 'users')
    qb.limit(10).offset(20)
    expect(qb.toSql()).toBe('SELECT * FROM users LIMIT 10 OFFSET 20')
  })

  it('select com colunas específicas', () => {
    const qb = new QueryBuilder(makeDriver(), 'users')
    qb.select('id', 'name', 'email')
    expect(qb.toSql()).toBe('SELECT id, name, email FROM users')
  })

  it('pipeline completo encadeado', () => {
    const qb = new QueryBuilder(makeDriver(), 'users')
    qb.select('id', 'name')
      .where('role', 'admin')
      .orderBy('name')
      .limit(5)
      .offset(0)
    expect(qb.toSql()).toBe(
      'SELECT id, name FROM users WHERE role = "admin" ORDER BY name ASC LIMIT 5 OFFSET 0'
    )
  })
})

// -----------------------------------------------
// QueryBuilder — execução (chama driver)
// -----------------------------------------------

describe('QueryBuilder — execução', () => {
  it('get() retorna rows do driver', async () => {
    const fakeRows = [{ id: 1, name: 'Teste' }]
    const driver = makeDriver(fakeRows)
    const result = await new QueryBuilder(driver, 'users').get()
    expect(result).toEqual(fakeRows)
  })

  it('first() retorna o primeiro item ou null', async () => {
    const driver = makeDriver([{ id: 1 }])
    const result = await new QueryBuilder(driver, 'users').first()
    expect(result).toEqual({ id: 1 })
  })

  it('first() retorna null quando sem resultado', async () => {
    const driver = makeDriver([])
    const result = await new QueryBuilder(driver, 'users').first()
    expect(result).toBeNull()
  })

  it('all() faz SELECT * sem WHERE', async () => {
    const driver = makeDriver([{ id: 1 }, { id: 2 }])
    const result = await new QueryBuilder(driver, 'users').all()
    expect(result).toHaveLength(2)
    expect(driver.query).toHaveBeenCalledWith('SELECT * FROM users')
  })

  it('find() consulta por id', async () => {
    const driver = makeDriver([{ id: 42, name: 'Test' }])
    const result = await new QueryBuilder(driver, 'users').find(42)
    expect(result).toEqual({ id: 42, name: 'Test' })
    expect(driver.query).toHaveBeenCalledWith(
      'SELECT * FROM users WHERE id = ? LIMIT 1', [42]
    )
  })

  it('find() retorna null quando não encontrado', async () => {
    const driver = makeDriver([])
    const result = await new QueryBuilder(driver, 'users').find(999)
    expect(result).toBeNull()
  })

  it('count() retorna número', async () => {
    const driver = makeDriver([{ total: 7 }])
    const result = await new QueryBuilder(driver, 'users').count()
    expect(result).toBe(7)
  })

  it('exists() retorna true quando count > 0', async () => {
    const driver = makeDriver([{ total: 3 }])
    const result = await new QueryBuilder(driver, 'users').exists()
    expect(result).toBe(true)
  })

  it('exists() retorna false quando count === 0', async () => {
    const driver = makeDriver([{ total: 0 }])
    const result = await new QueryBuilder(driver, 'users').exists()
    expect(result).toBe(false)
  })

  it('delete() chama driver com DELETE correto', async () => {
    const driver = makeDriver([], undefined, 1)
    const affected = await new QueryBuilder(driver, 'users').where('id', 1).delete()
    expect(affected).toBe(1)
    expect(driver.query).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM users'), expect.any(Array)
    )
  })

  it('paginate() retorna estrutura com data, total, page, perPage e lastPage', async () => {
    const driver = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      ping: vi.fn(),
      query: vi.fn()
        .mockResolvedValueOnce({ rows: [{ total: 30 }] })   // count
        .mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }] }), // get
    } as unknown as BaseDriver

    const result = await new QueryBuilder(driver, 'users').paginate(2, 10)

    expect(result.page).toBe(2)
    expect(result.perPage).toBe(10)
    expect(result.total).toBe(30)
    expect(result.lastPage).toBe(3)
    expect(result.data).toHaveLength(2)
  })
})