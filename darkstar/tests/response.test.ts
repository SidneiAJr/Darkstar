import { describe, it, expect, vi } from 'vitest'
import { TanisResponse } from '../packages/core/src/response'

// -----------------------------------------------
// Fábrica de mock do Express Response
// -----------------------------------------------

function makeRes() {
  const res: any = {}
  res.json      = vi.fn().mockReturnValue(res)
  res.send      = vi.fn().mockReturnValue(res)
  res.setHeader = vi.fn().mockReturnValue(res)
  res.status    = vi.fn().mockReturnValue(res)
  return res
}

// -----------------------------------------------
// Respostas de sucesso
// -----------------------------------------------

describe('TanisResponse — sucesso', () => {
  it('ok() responde com status 200', () => {
    const res = makeRes()
    new TanisResponse(res).ok({ id: 1 })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ id: 1 })
  })

  it('created() responde com status 201', () => {
    const res = makeRes()
    new TanisResponse(res).created({ id: 2 })
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({ id: 2 })
  })

  it('noContent() responde com status 204', () => {
    const res = makeRes()
    new TanisResponse(res).noContent()
    expect(res.status).toHaveBeenCalledWith(204)
    expect(res.send).toHaveBeenCalled()
  })

  it('json() chama res.json direto', () => {
    const res = makeRes()
    new TanisResponse(res).json({ ok: true })
    expect(res.json).toHaveBeenCalledWith({ ok: true })
  })
})

// -----------------------------------------------
// Respostas de erro
// -----------------------------------------------

describe('TanisResponse — erros', () => {
  it('badRequest() responde com status 400', () => {
    const res = makeRes()
    new TanisResponse(res).badRequest('campo inválido')
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: true, message: 'campo inválido' })
  })

  it('badRequest() usa mensagem padrão', () => {
    const res = makeRes()
    new TanisResponse(res).badRequest()
    expect(res.json).toHaveBeenCalledWith({ error: true, message: 'Bad Request' })
  })

  it('unauthorized() responde com status 401', () => {
    const res = makeRes()
    new TanisResponse(res).unauthorized()
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: true, message: 'Unauthorized' })
  })

  it('forbidden() responde com status 403', () => {
    const res = makeRes()
    new TanisResponse(res).forbidden()
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ error: true, message: 'Forbidden' })
  })

  it('notFound() responde com status 404', () => {
    const res = makeRes()
    new TanisResponse(res).notFound('User não encontrado')
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ error: true, message: 'User não encontrado' })
  })

  it('notFound() usa mensagem padrão', () => {
    const res = makeRes()
    new TanisResponse(res).notFound()
    expect(res.json).toHaveBeenCalledWith({ error: true, message: 'Not Found' })
  })

  it('unprocessable() responde com status 422 e errors', () => {
    const res = makeRes()
    new TanisResponse(res).unprocessable({ email: ['inválido'], name: ['obrigatório'] })
    expect(res.status).toHaveBeenCalledWith(422)
    expect(res.json).toHaveBeenCalledWith({
      error: true,
      message: 'Unprocessable Entity',
      errors: { email: ['inválido'], name: ['obrigatório'] },
    })
  })

  it('serverError() responde com status 500', () => {
    const res = makeRes()
    new TanisResponse(res).serverError()
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ error: true, message: 'Internal Server Error' })
  })

  it('serverError() com mensagem customizada', () => {
    const res = makeRes()
    new TanisResponse(res).serverError('algo explodiu')
    expect(res.json).toHaveBeenCalledWith({ error: true, message: 'algo explodiu' })
  })
})

// -----------------------------------------------
// Status customizado e headers
// -----------------------------------------------

describe('TanisResponse — status e headers', () => {
  it('status() define o código e permite encadeamento', () => {
    const res = makeRes()
    const tanisRes = new TanisResponse(res)
    tanisRes.status(202).send('accepted')
    expect(res.status).toHaveBeenCalledWith(202)
    expect(res.send).toHaveBeenCalledWith('accepted')
  })

  it('setHeader() define um header de resposta', () => {
    const res = makeRes()
    new TanisResponse(res).setHeader('X-Custom', 'valor')
    expect(res.setHeader).toHaveBeenCalledWith('X-Custom', 'valor')
  })

  it('raw() retorna o response original do Express', () => {
    const expressRes = makeRes()
    const tanisRes = new TanisResponse(expressRes)
    expect(tanisRes.raw()).toBe(expressRes)
  })
})