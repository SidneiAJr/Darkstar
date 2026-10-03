import { Route } from 'tanis-core'
import { UserController } from '../controllers/UserController'

Route.resource('users', UserController)
