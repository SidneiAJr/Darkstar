import { describe, it, expect, beforeEach } from 'vitest'
import { TanisRouter } from '../packages/core/src/router'

// -----------------------------------------------
// Controller fake pra registrar rotas
// -----------------------------------------------

class UserController {
  async index()   {}
  async show()    {}
  async store()   {}
  async update()  {}
  async destroy() {}
}

class PostController {
  async index() {}
}

// -----------------------------------------------
// Router — registro de rotas
// -----------------------------------------------

describe('TanisRouter — registro de rotas', () => {
  let router: TanisRouter

  beforeEach(() => {
    router = new TanisRouter()
  })

  it('get() registra rota GET', () => {
    router.get('/users', [UserController, 'index'])
    const routes = router.list()
    expect(routes).toHaveLength(1)
    expect(routes[0]).toMatchObject({ method: 'GET', path: '/users', action: 'index' })
  })

  it('post() registra rota POST', () => {
    router.post('/users', [UserController, 'store'])
    const routes = router.list()
    expect(routes[0]).toMatchObject({ method: 'POST', path: '/users', action: 'store' })
  })

  it('put() registra rota PUT', () => {
    router.put('/users/:id', [UserController, 'update'])
    const routes = router.list()
    expect(routes[0]).toMatchObject({ method: 'PUT', path: '/users/:id', action: 'update' })
  })

  it('patch() registra rota PATCH', () => {
    router.patch('/users/:id', [UserController, 'update'])
    const routes = router.list()
    expect(routes[0]).toMatchObject({ method: 'PATCH', path: '/users/:id' })
  })

  it('delete() registra rota DELETE', () => {
    router.delete('/users/:id', [UserController, 'destroy'])
    const routes = router.list()
    expect(routes[0]).toMatchObject({ method: 'DELETE', path: '/users/:id', action: 'destroy' })
  })

  it('resource() registra as 5 rotas REST', () => {
    router.resource('users', UserController)
    const routes = router.list()

    expect(routes).toHaveLength(5)
    expect(routes).toEqual(expect.arrayContaining([
      expect.objectContaining({ method: 'GET',    path: '/users',     action: 'index'   }),
      expect.objectContaining({ method: 'POST',   path: '/users',     action: 'store'   }),
      expect.objectContaining({ method: 'GET',    path: '/users/:id', action: 'show'    }),
      expect.objectContaining({ method: 'PUT',    path: '/users/:id', action: 'update'  }),
      expect.objectContaining({ method: 'DELETE', path: '/users/:id', action: 'destroy' }),
    ]))
  })

  it('list() inclui o nome do controller', () => {
    router.get('/posts', [PostController, 'index'])
    const routes = router.list()
    expect(routes[0].controller).toBe('PostController')
  })

  it('múltiplos resources acumulam rotas corretamente', () => {
    router.resource('users', UserController)
    router.resource('posts', PostController)
    expect(router.list()).toHaveLength(6) // 5 de users + 1 de posts (só tem index)
  })

  it('encadeamento retorna o próprio router', () => {
    const result = router.get('/a', [UserController, 'index'])
    expect(result).toBe(router)
  })
})

// -----------------------------------------------
// Router — build() gera express router
// -----------------------------------------------

describe('TanisRouter — build()', () => {
  it('build() retorna um objeto com as rotas registradas', () => {
    const router = new TanisRouter()
    router.resource('users', UserController)
    const expressRouter = router.build()
    // Express router é uma função com propriedade stack
    expect(typeof expressRouter).toBe('function')
    expect(expressRouter.stack).toHaveLength(5)
  })

  it('build() sem rotas retorna router vazio', () => {
    const router = new TanisRouter()
    const expressRouter = router.build()
    expect(expressRouter.stack).toHaveLength(0)
  })
})