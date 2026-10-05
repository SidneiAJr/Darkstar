import { describe, it, expect, beforeEach } from 'vitest'

// Importa a classe, não a instância singleton, pra cada teste ter seu container limpo
import { TanisContainer } from '../packages/core/src/container'

// -----------------------------------------------
// Classes de exemplo para os testes
// -----------------------------------------------

class EmailService {
  send() { return 'email enviado' }
}

class UserRepository {
  findAll() { return [] }
}

class UserService {
  constructor(public userRepository: UserRepository) {}
}

class UserController {
  constructor(public userService: UserService) {}
}

// -----------------------------------------------
// Container
// -----------------------------------------------

describe('TanisContainer — bind e make', () => {
  let container: TanisContainer

  beforeEach(() => {
    container = new TanisContainer()
  })

  it('make() instancia uma classe sem dependências', () => {
    container.bind('EmailService', EmailService)
    const svc = container.make<EmailService>('EmailService')
    expect(svc).toBeInstanceOf(EmailService)
    expect(svc.send()).toBe('email enviado')
  })

  it('make() resolve dependências automaticamente pelo nome do parâmetro', () => {
    container.bind('UserRepository', UserRepository)
    container.bind('UserService', UserService)

    const svc = container.make<UserService>('UserService')
    expect(svc).toBeInstanceOf(UserService)
    expect(svc.userRepository).toBeInstanceOf(UserRepository)
  })

  it('make() resolve cadeia de dependências (Controller → Service → Repository)', () => {
    container.bind('UserRepository',  UserRepository)
    container.bind('UserService',     UserService)
    container.bind('UserController',  UserController)

    const ctrl = container.make<UserController>('UserController')
    expect(ctrl).toBeInstanceOf(UserController)
    expect(ctrl.userService).toBeInstanceOf(UserService)
    expect(ctrl.userService.userRepository).toBeInstanceOf(UserRepository)
  })

  it('make() aceita a classe diretamente (sem string)', () => {
    const svc = container.make(EmailService)
    expect(svc).toBeInstanceOf(EmailService)
  })

  it('make() cria nova instância a cada chamada (sem singleton)', () => {
    container.bind('EmailService', EmailService)
    const a = container.make('EmailService')
    const b = container.make('EmailService')
    expect(a).not.toBe(b)
  })
})

describe('TanisContainer — singleton', () => {
  let container: TanisContainer

  beforeEach(() => {
    container = new TanisContainer()
  })

  it('singleton() retorna sempre a mesma instância', () => {
    container.singleton('EmailService', EmailService)
    const a = container.make<EmailService>('EmailService')
    const b = container.make<EmailService>('EmailService')
    expect(a).toBe(b)
  })

  it('singleton() resolve dependências na criação', () => {
    container.bind('UserRepository', UserRepository)
    container.singleton('UserService', UserService)

    const svc = container.make<UserService>('UserService')
    expect(svc.userRepository).toBeInstanceOf(UserRepository)
  })
})