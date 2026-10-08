import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Model } from '../packages/orm/src/model'
import { Connection } from '../packages/orm/src/connection'
import type { BaseDriver } from '../packages/orm/src/drivers/base-driver'

// -----------------------------------------------
// Mock do driver e Connection
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
// Model de exemplo
// -----------------------------------------------

class User extends Model {
  static table = 'users'
}

class Post extends Model {
  static table = 'posts'
}

// -----------------------------------------------
// Model — métodos estáticos
// -----------------------------------------------

describe('Model — findAll()', () => {
  it('retorna todos os registros da tabela', async () => {
    const driver = makeDriver([{ id: 1, name: 'Teste' }, { id: 2, name: 'Maria' }])
    vi.spyOn(Connection, 'get').mockReturnValue(driver)

    const result = await User.findAll()

    expect(result).toHaveLength(2)
    expect(driver.query).toHaveBeenCalledWith('SELECT * FROM users')
  })

  it('retorna array vazio quando não há registros', async () => {
    const driver = makeDriver([])
    vi.spyOn(Connection, 'get').mockReturnValue(driver)

    const result = await User.findAll()
    expect(result).toEqual([])
  })
})

describe('Model — findById()', () => {
  it('retorna o registro pelo id', async () => {
    const driver = makeDriver([{ id: 42, name: 'Teste' }])
    vi.spyOn(Connection, 'get').mockReturnValue(driver)

    const result = await User.findById(42)

    expect(result).toEqual({ id: 42, name: 'Teste' })
    expect(driver.query).toHaveBeenCalledWith(
      'SELECT * FROM users WHERE id = ? LIMIT 1', [42]
    )
  })

  it('retorna null quando id não existe', async () => {
    const driver = makeDriver([])
    vi.spyOn(Connection, 'get').mockReturnValue(driver)

    const result = await User.findById(999)
    expect(result).toBeNull()
  })
})

describe('Model — findBy()', () => {
  it('retorna registros que batem com coluna e valor', async () => {
    const driver = makeDriver([{ id: 1, role: 'admin' }])
    vi.spyOn(Connection, 'get').mockReturnValue(driver)

    const result = await User.findBy('role', 'admin')
    expect(result).toHaveLength(1)
    expect(driver.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE role'), expect.any(Array)
    )
  })

  it('retorna array vazio quando nenhum registro bate', async () => {
    const driver = makeDriver([])
    vi.spyOn(Connection, 'get').mockReturnValue(driver)

    const result = await User.findBy('role', 'superadmin')
    expect(result).toEqual([])
  })
})

describe('Model — findFirstBy()', () => {
  it('retorna o primeiro registro que bate', async () => {
    const driver = makeDriver([{ id: 1, email: 'p@p.com' }])
    vi.spyOn(Connection, 'get').mockReturnValue(driver)

    const result = await User.findFirstBy('email', 'p@p.com')
    expect(result).toEqual({ id: 1, email: 'p@p.com' })
  })

  it('retorna null quando não encontrado', async () => {
    const driver = makeDriver([])
    vi.spyOn(Connection, 'get').mockReturnValue(driver)

    const result = await User.findFirstBy('email', 'nao@existe.com')
    expect(result).toBeNull()
  })
})

describe('Model — create()', () => {
  it('insere um registro e retorna o objeto criado', async () => {
    const driver = makeDriver([{ id: 1, name: 'Teste', email: 'p@p.com' }], 1)
    vi.spyOn(Connection, 'get').mockReturnValue(driver)

    const result = await User.create({ name: 'Teste', email: 'p@p.com' } as any)

    expect(result).toMatchObject({ id: 1, name: 'Teste' })
    expect(driver.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO users'), expect.any(Array)
    )
  })
})

describe('Model — update()', () => {
  it('atualiza o registro pelo id', async () => {
    const driver = makeDriver([{ id: 1, name: 'Teste Atualizado' }], undefined, 1)
    vi.spyOn(Connection, 'get').mockReturnValue(driver)

    const result = await User.update(1, { name: 'Teste Atualizado' } as any)

    expect(driver.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE users'), expect.any(Array)
    )
  })
})

describe('Model — delete()', () => {
  it('deleta o registro pelo id e retorna affectedRows', async () => {
    const driver = makeDriver([], undefined, 1)
    vi.spyOn(Connection, 'get').mockReturnValue(driver)

    const affected = await User.delete(1)

    expect(affected).toBe(1)
    expect(driver.query).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM users'), expect.any(Array)
    )
  })

  it('retorna 0 quando id não existe', async () => {
    const driver = makeDriver([], undefined, 0)
    vi.spyOn(Connection, 'get').mockReturnValue(driver)

    const affected = await User.delete(999)
    expect(affected).toBe(0)
  })
})

describe('Model — query() usa a tabela correta', () => {
  it('cada model usa sua própria tabela', async () => {
    const userDriver = makeDriver([])
    const postDriver = makeDriver([])
    vi.spyOn(Connection, 'get')
      .mockReturnValueOnce(userDriver)
      .mockReturnValueOnce(postDriver)

    await User.findAll()
    await Post.findAll()

    expect(userDriver.query).toHaveBeenCalledWith('SELECT * FROM users')
    expect(postDriver.query).toHaveBeenCalledWith('SELECT * FROM posts')
  })
})