import { UserRepository } from '../repositories/UserRepository'

export class UserService {
  constructor(private userRepository: UserRepository) {}

  findAll()                                    { return this.userRepository.findAll() }
  findById(id: string)                         { return this.userRepository.findById(id) }
  create(data: Record<string, any>)            { return this.userRepository.create(data) }
  update(id: string, data: Record<string, any>) { return this.userRepository.update(id, data) }
  delete(id: string)                           { return this.userRepository.delete(id) }
}
