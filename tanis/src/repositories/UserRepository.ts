import { User } from '../models/User'

export class UserRepository {
  findAll()                                    { return User.findAll() }
  findById(id: string)                         { return User.findById(id) }
  create(data: Record<string, any>)            { return User.create(data as any) }
  update(id: string, data: Record<string, any>) { return User.update(id, data as any) }
  delete(id: string)                           { return User.delete(id) }
}
