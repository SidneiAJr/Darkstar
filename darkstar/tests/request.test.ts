import { describe, it, expect } from 'vitest'
import { TanisRequest } from '../packages/core/src/request'

// -----------------------------------------------
// Fábrica de mock do Express Request
// -----------------------------------------------

function makeReq(overrides: Record<string, any> = {}) {
  return {
    body:        {},
    query:       {},
    params:      {},
    headers:     {},
    method:      'GET',
    path:        '/',
    originalUrl: '/',
    ip:          '127.0.0.1',
    is:          () => false,
    ...overrides,
  } as any
}

// -----------------------------------------------
// Body
// -----------------------------------------------

describe('TanisRequest — body', () => {
  it('input() retorna campo do body', () => {
    const req = new TanisRequest(makeReq({ body: { name: 'Pedro' } }))
    expect(req.input('name')).toBe('Pedro')
  })

  it('input() retorna fallback quando campo ausente', () => {
    const req = new TanisRequest(makeReq())
    expect(req.input('name', 'default')).toBe('default')
  })

  it('only() retorna apenas os campos pedidos', () => {
    const req = new TanisRequest(makeReq({ body: { name: 'Pedro', email: 'p@p.com', password: '123' } }))
    expect(req.only('name', 'email')).toEqual({ name: 'Pedro', email: 'p@p.com' })
  })

  it('only() ignora campos ausentes no body', () => {
    const req = new TanisRequest(makeReq({ body: { name: 'Pedro' } }))
    expect(req.only('name', 'email')).toEqual({ name: 'Pedro' })
  })

  it('except() retorna body sem os campos excluídos', () => {
    const req = new TanisRequest(makeReq({ body: { name: 'Pedro', email: 'p@p.com', password: '123' } }))
    expect(req.except('password')).toEqual({ name: 'Pedro', email: 'p@p.com' })
  })

  it('all() combina body + query + params', () => {
    const req = new TanisRequest(makeReq({
      body:   { name: 'Pedro' },
      query:  { page: '1' },
      params: { id: '42' },
    }))
    expect(req.all()).toEqual({ name: 'Pedro', page: '1', id: '42' })
  })

  it('has() retorna true quando campo existe no body', () => {
    const req = new TanisRequest(makeReq({ body: { email: 'p@p.com' } }))
    expect(req.has('email')).toBe(true)
  })

  it('has() retorna false quando campo ausente', () => {
    const req = new TanisRequest(makeReq())
    expect(req.has('email')).toBe(false)
  })
})

// -----------------------------------------------
// Params e Query
// -----------------------------------------------

describe('TanisRequest — params e query', () => {
  it('param() retorna parâmetro de rota', () => {
    const req = new TanisRequest(makeReq({ params: { id: '99' } }))
    expect(req.param('id')).toBe('99')
  })

  it('param() retorna undefined quando ausente', () => {
    const req = new TanisRequest(makeReq())
    expect(req.param('id')).toBeUndefined()
  })

  it('param() retorna primeiro valor quando array', () => {
    const req = new TanisRequest(makeReq({ params: { id: ['1', '2'] } }))
    expect(req.param('id')).toBe('1')
  })

  it('query() retorna parâmetro de query string', () => {
    const req = new TanisRequest(makeReq({ query: { page: '2' } }))
    expect(req.query('page')).toBe('2')
  })

  it('query() retorna fallback quando ausente', () => {
    const req = new TanisRequest(makeReq())
    expect(req.query('page', '1')).toBe('1')
  })

  it('query() retorna primeiro valor quando array', () => {
    const req = new TanisRequest(makeReq({ query: { tag: ['a', 'b'] } }))
    expect(req.query('tag')).toBe('a')
  })
})

// -----------------------------------------------
// Headers
// -----------------------------------------------

describe('TanisRequest — headers', () => {
  it('header() retorna header pelo nome', () => {
    const req = new TanisRequest(makeReq({ headers: { 'content-type': 'application/json' } }))
    expect(req.header('content-type')).toBe('application/json')
  })

  it('header() é case-insensitive', () => {
    const req = new TanisRequest(makeReq({ headers: { 'authorization': 'Bearer abc' } }))
    expect(req.header('Authorization')).toBe('Bearer abc')
  })

  it('bearerToken() extrai token do header Authorization', () => {
    const req = new TanisRequest(makeReq({ headers: { authorization: 'Bearer meu-token-123' } }))
    expect(req.bearerToken()).toBe('meu-token-123')
  })

  it('bearerToken() retorna null sem header', () => {
    const req = new TanisRequest(makeReq())
    expect(req.bearerToken()).toBeNull()
  })

  it('bearerToken() retorna null quando não é Bearer', () => {
    const req = new TanisRequest(makeReq({ headers: { authorization: 'Basic abc123' } }))
    expect(req.bearerToken()).toBeNull()
  })
})

// -----------------------------------------------
// Checagens
// -----------------------------------------------

describe('TanisRequest — checagens', () => {
  it('method() retorna o método HTTP', () => {
    const req = new TanisRequest(makeReq({ method: 'POST' }))
    expect(req.method()).toBe('POST')
  })

  it('path() retorna o caminho da rota', () => {
    const req = new TanisRequest(makeReq({ path: '/api/users' }))
    expect(req.path()).toBe('/api/users')
  })

  it('url() retorna a URL completa', () => {
    const req = new TanisRequest(makeReq({ originalUrl: '/api/users?page=1' }))
    expect(req.url()).toBe('/api/users?page=1')
  })

  it('ip() retorna o IP do cliente', () => {
    const req = new TanisRequest(makeReq({ ip: '192.168.1.1' }))
    expect(req.ip()).toBe('192.168.1.1')
  })

  it('raw() retorna o request original do Express', () => {
    const expressReq = makeReq({ method: 'DELETE' })
    const req = new TanisRequest(expressReq)
    expect(req.raw()).toBe(expressReq)
  })
})