import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@darkstar/orm', () => ({
  Connection: {
    connect:    vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    get:        vi.fn(),
  },
}))

vi.mock('kleur', () => ({
  default: {
    red:   (s: string) => s,
    cyan:  (s: string) => s,
    green: (s: string) => s,
    gray:  (s: string) => s,
  },
}))

// -----------------------------------------------
// TanisApp — bootstrap
// -----------------------------------------------

describe('TanisApp — bootstrap', () => {
  beforeEach(() => { vi.resetModules() })

  it('getApp() retorna instância do Express', async () => {
    vi.doMock('../packages/core/src/router', () => ({
      Route:       { build: vi.fn().mockReturnValue(vi.fn()) },
      TanisRouter: class {},
    }))

    const { TanisApp } = await import('../packages/core/src/app')
    const app = new TanisApp()
    const expressApp = app.getApp()

    expect(typeof expressApp).toBe('function')
    expect(expressApp.use).toBeDefined()
  })

  it('boot() conecta ao banco e retorna a instância', async () => {
    vi.doMock('../packages/core/src/router', () => ({
      Route:       { build: vi.fn().mockReturnValue(vi.fn()) },
      TanisRouter: class {},
    }))

    const { TanisApp } = await import('../packages/core/src/app')
    const { Connection } = await import('@darkstar/orm')

    const tanisApp = new TanisApp()
    const result = await tanisApp.boot()

    expect(Connection.connect).toHaveBeenCalled()
    expect(result).toBe(tanisApp)
  })
})

// -----------------------------------------------
// TanisApp — errorHandler
// -----------------------------------------------

describe('TanisApp — errorHandler', () => {
  beforeEach(() => { vi.resetModules() })

  it('responde 500 com message do erro', async () => {
    vi.doMock('../packages/core/src/router', () => ({
      Route:       { build: vi.fn().mockReturnValue(vi.fn()) },
      TanisRouter: class {},
    }))

    const { TanisApp } = await import('../packages/core/src/app')
    const tanisApp = new TanisApp()

    tanisApp.getApp().get('/test-error', (_req: any, _res: any, next: any) => {
      next(new Error('algo explodiu'))
    })

    await tanisApp.boot()

    await new Promise<void>((resolve, reject) => {
      const http = require('http')
      const server = http.createServer(tanisApp.getApp())
      server.listen(0, () => {
        const port = server.address().port
        http.get(`http://localhost:${port}/test-error`, (res: any) => {
          let body = ''
          res.on('data', (chunk: any) => { body += chunk })
          res.on('end', () => {
            try {
              const json = JSON.parse(body)
              expect(res.statusCode).toBe(500)
              expect(json.error).toBe(true)
              expect(json.message).toBe('algo explodiu')
              resolve()
            } catch (e) { reject(e) }
            finally { server.close() }
          })
        }).on('error', (e: any) => { server.close(); reject(e) })
      })
    })
  })
})

// -----------------------------------------------
// TanisApp — notFound
// -----------------------------------------------

describe('TanisApp — notFound', () => {
  beforeEach(() => { vi.resetModules() })

  it('responde 404 para rota não registrada', async () => {
    vi.doMock('../packages/core/src/router', () => ({
      Route:       { build: vi.fn().mockReturnValue(vi.fn()) },
      TanisRouter: class {},
    }))

    const { TanisApp } = await import('../packages/core/src/app')
    const tanisApp = new TanisApp()
    await tanisApp.boot()

    await new Promise<void>((resolve, reject) => {
      const http = require('http')
      const server = http.createServer(tanisApp.getApp())
      server.listen(0, () => {
        const port = server.address().port
        http.get(`http://localhost:${port}/rota-inexistente`, (res: any) => {
          let body = ''
          res.on('data', (chunk: any) => { body += chunk })
          res.on('end', () => {
            try {
              const json = JSON.parse(body)
              expect(res.statusCode).toBe(404)
              expect(json.error).toBe(true)
              expect(json.message).toContain('Rota não encontrada')
              resolve()
            } catch (e) { reject(e) }
            finally { server.close() }
          })
        }).on('error', (e: any) => { server.close(); reject(e) })
      })
    })
  })
})