import { Response as ExpressResponse } from 'express'

// -----------------------------------------------
// TanisResponse — wrapper do Response do Express
// -----------------------------------------------

class TanisResponse {
  constructor(private res: ExpressResponse) {}

  // -----------------------------------------------
  // JSON
  // -----------------------------------------------

  json(data: any) {
    return this.res.json(data)
  }

  ok(data: any) {
    return this.res.status(200).json(data)
  }

  created(data: any) {
    return this.res.status(201).json(data)
  }

  noContent() {
    return this.res.status(204).send()
  }

  // -----------------------------------------------
  // Erros
  // -----------------------------------------------

  badRequest(message: string = 'Bad Request', data?: any) {
    return this.res.status(400).json({ error: true, message, ...data })
  }

  unauthorized(message: string = 'Unauthorized') {
    return this.res.status(401).json({ error: true, message })
  }

  forbidden(message: string = 'Forbidden') {
    return this.res.status(403).json({ error: true, message })
  }

  notFound(message: string = 'Not Found') {
    return this.res.status(404).json({ error: true, message })
  }

  unprocessable(errors: Record<string, string[]>) {
    return this.res.status(422).json({ error: true, message: 'Unprocessable Entity', errors })
  }

  serverError(message: string = 'Internal Server Error') {
    return this.res.status(500).json({ error: true, message })
  }

  // -----------------------------------------------
  // Status customizado
  // -----------------------------------------------

  status(code: number) {
    this.res.status(code)
    return this
  }

  send(data: any) {
    return this.res.send(data)
  }

  // -----------------------------------------------
  // Headers
  // -----------------------------------------------

  setHeader(key: string, value: string) {
    this.res.setHeader(key, value)
    return this
  }

  // -----------------------------------------------
  // Acesso ao response original do Express
  // -----------------------------------------------

  raw(): ExpressResponse {
    return this.res
  }
}

export { TanisResponse }
export type { ExpressResponse as Response }