import { createModel, Model } from 'tanis-orm'

class UserModel extends Model {
  static table = 'users'
}

export const User = createModel(UserModel)
