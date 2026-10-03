import { Request as ExpressRequest } from 'express'

// -----------------------------------------------
// TanisRequest — wrapper do Request do Express
// -----------------------------------------------

class TanisRequest {
  constructor(private req: ExpressRequest) {}

  // -----------------------------------------------
  // Body
  // -----------------------------------------------

  input<T = any>(key: string, fallback?: T): T {
    return this.req.body?.[key] ?? fallback
  }

  only(...keys: string[]): Record<string, any> {
    return keys.reduce((acc, key) => {
      if (this.req.body?.[key] !== undefined) {
        acc[key] = this.req.body[key]
      }
      return acc
    }, {} as Record<string, any>)
  }

  except(...keys: string[]): Record<string, any> {
    const body = { ...this.req.body }
    keys.forEach(key => delete body[key])
    return body
  }

  all(): Record<string, any> {
    return {
      ...this.req.body,
      ...this.req.query,
      ...this.req.params,
    }
  }

  // -----------------------------------------------
  // Params e Query
  // -----------------------------------------------

  param(key: string): string | undefined {
  const value = this.req.params[key]
  if (Array.isArray(value)) return value[0]
  return value
}
  
 query<T = string>(key: string, fallback?: T): T {
  const value = this.req.query[key]
  if (Array.isArray(value)) return value[0] as T
  return (value as T) ?? fallback!
}
  // -----------------------------------------------
  // Headers
  // -----------------------------------------------

 header(key: string): string | undefined {
  const value = this.req.headers[key.toLowerCase()]
  if (Array.isArray(value)) return value[0]
  return value
}
  bearerToken(): string | null {
    const auth = this.header('authorization')
    if (!auth || !auth.startsWith('Bearer ')) return null
    return auth.slice(7)
  }

  // -----------------------------------------------
  // Checagens
  // -----------------------------------------------

  has(key: string): boolean {
    return this.req.body?.[key] !== undefined
  }

  isJson(): boolean {
    return this.req.is('application/json') !== false
  }

  method(): string {
    return this.req.method
  }

  path(): string {
    return this.req.path
  }

  url(): string {
    return this.req.originalUrl
  }

  ip(): string {
    return this.req.ip ?? ''
  }

  // -----------------------------------------------
  // Acesso ao request original do Express
  // -----------------------------------------------

  raw(): ExpressRequest {
    return this.req
  }
}

export { TanisRequest }
export type { ExpressRequest as Request }