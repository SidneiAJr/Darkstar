import { TanisRequest, TanisResponse } from 'tanis-core'
import { UserService } from '../services/UserService'

export class UserController {
  constructor(private userService: UserService) {}

  async index(req: TanisRequest, res: TanisResponse) {
    const data = await this.userService.findAll()
    return res.ok(data)
  }

  async show(req: TanisRequest, res: TanisResponse) {
    const data = await this.userService.findById(req.param('id')!)
    if (!data) return res.notFound('User não encontrado')
    return res.ok(data)
  }

  async store(req: TanisRequest, res: TanisResponse) {
    const data = await this.userService.create(req.all())
    return res.created(data)
  }

  async update(req: TanisRequest, res: TanisResponse) {
    const data = await this.userService.update(req.param('id')!, req.all())
    return res.ok(data)
  }

  async destroy(req: TanisRequest, res: TanisResponse) {
    await this.userService.delete(req.param('id')!)
    return res.noContent()
  }
}
