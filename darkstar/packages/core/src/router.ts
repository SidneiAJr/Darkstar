import { Router as ExpressRouter, Request, Response, NextFunction } from 'express'
import { Container } from './container'
import { DarkstarRequest } from './request'
import { DarkstarResponse } from './response'

// -----------------------------------------------
// Tipos
// -----------------------------------------------

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

type ControllerClass = new (...args: any[]) => any

type Middleware = (req: Request, res: Response, next: NextFunction) => void

interface RouteDefinition {
  method: HttpMethod
  path: string
  controller: ControllerClass
  action: string
  middlewares: Middleware[]
}

// -----------------------------------------------
// Router
// -----------------------------------------------

class DarkstarRouter {
  private routes: RouteDefinition[] = []
  private middlewareStack: Middleware[] = []

  get(path: string, handler: [ControllerClass, string], middlewares: Middleware[] = []) {
    this.addRoute('get', path, handler[0], handler[1], middlewares)
    return this
  }

  post(path: string, handler: [ControllerClass, string], middlewares: Middleware[] = []) {
    this.addRoute('post', path, handler[0], handler[1], middlewares)
    return this
  }

  put(path: string, handler: [ControllerClass, string], middlewares: Middleware[] = []) {
    this.addRoute('put', path, handler[0], handler[1], middlewares)
    return this
  }

  patch(path: string, handler: [ControllerClass, string], middlewares: Middleware[] = []) {
    this.addRoute('patch', path, handler[0], handler[1], middlewares)
    return this
  }

  delete(path: string, handler: [ControllerClass, string], middlewares: Middleware[] = []) {
    this.addRoute('delete', path, handler[0], handler[1], middlewares)
    return this
  }

  resource(name: string, controller: ControllerClass, middlewares: Middleware[] = []) {
    const base = `/${name}`
    const byId  = `/${name}/:id`
    const proto = controller.prototype

    const map: [HttpMethod, string, string][] = [
      ['get',    base,  'index'],
      ['post',   base,  'store'],
      ['get',    byId,  'show'],
      ['put',    byId,  'update'],
      ['delete', byId,  'destroy'],
    ]

    for (const [method, path, action] of map) {
      if (typeof proto[action] === 'function') {
        this.addRoute(method, path, controller, action, middlewares)
      }
    }

    return this
  }

  use(...middlewares: Middleware[]) {
    this.middlewareStack.push(...middlewares)
    return this
  }

  private addRoute(
    method: HttpMethod,
    path: string,
    controller: ControllerClass,
    action: string,
    middlewares: Middleware[]
  ) {
    this.routes.push({ method, path, controller, action, middlewares })
  }

  build(): ExpressRouter {
    const router = ExpressRouter()

    if (this.middlewareStack.length > 0) {
      router.use(...this.middlewareStack)
    }

    for (const route of this.routes) {
      const handler = async (req: Request, res: Response, next: NextFunction) => {
        try {
          const instance = Container.make(route.controller)

          if (typeof instance[route.action] !== 'function') {
            throw new Error(
              `Action "${route.action}" não encontrada em ${route.controller.name}`
            )
          }

          const darkReq = new DarkstarRequest(req)
          const darkRes = new DarkstarResponse(res)

          await instance[route.action](darkReq, darkRes, next)
        } catch (err) {
          next(err)
        }
      }

      router[route.method](route.path, ...route.middlewares, handler)
    }

    return router
  }

  list() {
    return this.routes.map(r => ({
      method: r.method.toUpperCase(),
      path: r.path,
      controller: r.controller.name,
      action: r.action,
    }))
  }
}

export const Route = new DarkstarRouter()
export { DarkstarRouter }
export { DarkstarRouter as TanisRouter }
