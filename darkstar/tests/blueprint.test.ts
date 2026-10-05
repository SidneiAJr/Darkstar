import { describe, it, expect } from 'vitest'
import { Blueprint } from '../packages/orm/src/blueprint'

describe('Blueprint — definição de colunas', () => {
  it('id() gera coluna BIGINT UNSIGNED AUTO_INCREMENT PRIMARY', () => {
    const bp = new Blueprint()
    bp.id()
    const col = bp.columns[0]
    expect(col.name).toBe('id')
    expect(col.type).toBe('BIGINT')
    expect(col.unsigned).toBe(true)
    expect(col.autoIncrement).toBe(true)
    expect(col.primary).toBe(true)
    expect(col.nullable).toBe(false)
  })

  it('uuid() gera coluna VARCHAR(36) PRIMARY', () => {
    const bp = new Blueprint()
    bp.uuid('uuid')
    const col = bp.columns[0]
    expect(col.name).toBe('uuid')
    expect(col.type).toBe('VARCHAR')
    expect(col.length).toBe(36)
    expect(col.unique).toBe(true)
    expect(col.primary).toBe(true)
    expect(bp.primaryKey).toBe('uuid')
  })

  it('string() gera VARCHAR com comprimento padrão 255', () => {
    const bp = new Blueprint()
    bp.string('name')
    const col = bp.columns[0]
    expect(col.type).toBe('VARCHAR')
    expect(col.length).toBe(255)
    expect(col.nullable).toBe(false)
  })

  it('string() com comprimento customizado', () => {
    const bp = new Blueprint()
    bp.string('token', 64)
    expect(bp.columns[0].length).toBe(64)
  })

  it('nullable() marca a coluna como nullable', () => {
    const bp = new Blueprint()
    bp.string('nickname').nullable()
    expect(bp.columns[0].nullable).toBe(true)
  })

  it('unique() marca a coluna como unique', () => {
    const bp = new Blueprint()
    bp.string('email').unique()
    expect(bp.columns[0].unique).toBe(true)
  })

  it('default() define valor padrão', () => {
    const bp = new Blueprint()
    bp.boolean('active').default(true)
    expect(bp.columns[0].default).toBe(true)
  })

  it('integer() gera coluna INT', () => {
    const bp = new Blueprint()
    bp.integer('age')
    expect(bp.columns[0].type).toBe('INT')
  })

  it('bigInteger() gera coluna BIGINT', () => {
    const bp = new Blueprint()
    bp.bigInteger('views')
    expect(bp.columns[0].type).toBe('BIGINT')
  })

  it('decimal() com precisão customizada', () => {
    const bp = new Blueprint()
    bp.decimal('price', 10, 4)
    const col = bp.columns[0]
    expect(col.type).toBe('DECIMAL')
    expect(col.precision).toBe(10)
    expect(col.scale).toBe(4)
  })

  it('boolean() gera TINYINT(1)', () => {
    const bp = new Blueprint()
    bp.boolean('active')
    const col = bp.columns[0]
    expect(col.type).toBe('TINYINT')
    expect(col.length).toBe(1)
  })

  it('text() gera TEXT', () => {
    const bp = new Blueprint()
    bp.text('bio')
    expect(bp.columns[0].type).toBe('TEXT')
  })

  it('longText() gera LONGTEXT', () => {
    const bp = new Blueprint()
    bp.longText('content')
    expect(bp.columns[0].type).toBe('LONGTEXT')
  })

  it('json() gera JSON', () => {
    const bp = new Blueprint()
    bp.json('metadata')
    expect(bp.columns[0].type).toBe('JSON')
  })

  it('date() gera DATE', () => {
    const bp = new Blueprint()
    bp.date('birthday')
    expect(bp.columns[0].type).toBe('DATE')
  })

  it('dateTime() gera DATETIME', () => {
    const bp = new Blueprint()
    bp.dateTime('scheduled_at')
    expect(bp.columns[0].type).toBe('DATETIME')
  })

  it('timestamp() gera TIMESTAMP', () => {
    const bp = new Blueprint()
    bp.timestamp('confirmed_at')
    expect(bp.columns[0].type).toBe('TIMESTAMP')
  })

  it('timestamps() adiciona created_at e updated_at', () => {
    const bp = new Blueprint()
    bp.timestamps()
    expect(bp.columns).toHaveLength(2)
    expect(bp.columns[0].name).toBe('created_at')
    expect(bp.columns[1].name).toBe('updated_at')
    expect(bp.columns[0].default).toBe('CURRENT_TIMESTAMP')
    expect(bp.columns[1].default).toBe('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
  })

  it('softDeletes() adiciona deleted_at nullable', () => {
    const bp = new Blueprint()
    bp.softDeletes()
    const col = bp.columns[0]
    expect(col.name).toBe('deleted_at')
    expect(col.nullable).toBe(true)
    expect(col.default).toBeUndefined()
  })

  it('foreignId() gera BIGINT UNSIGNED com referência', () => {
    const bp = new Blueprint()
    bp.foreignId('user_id').references('id').on('users')
    const col = bp.columns[0]
    expect(col.name).toBe('user_id')
    expect(col.type).toBe('BIGINT')
    expect(col.unsigned).toBe(true)
    expect(col.references).toEqual({ table: 'users', column: 'id' })
  })

  it('encadeamento id + string + timestamps', () => {
    const bp = new Blueprint()
    bp.id()
    bp.string('name')
    bp.timestamps()
    expect(bp.columns).toHaveLength(4) // id, name, created_at, updated_at
    expect(bp.columns.map(c => c.name)).toEqual(['id', 'name', 'created_at', 'updated_at'])
  })
})