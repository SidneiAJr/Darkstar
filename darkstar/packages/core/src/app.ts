import express, { Application, Request, Response, NextFunction } from 'express'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { Route, TanisRouter } from './router'
import { Connection } from '@darkstar/orm'
import kleur from 'kleur'

dotenv.config()

class TanisApp {
  private app: Application

  constructor() {
    this.app = express()
    this.bootstrapMiddlewares()
  }

  private bootstrapMiddlewares() {
    this.app.use(express.json())
    this.app.use(express.urlencoded({ extended: true }))
  }

  private async loadRoutes() {
    const routesPath = path.resolve(process.cwd(), 'src', 'routes')

    if (!fs.existsSync(routesPath)) return

    const files = fs.readdirSync(routesPath).filter(f => f.endsWith('.ts') || f.endsWith('.js'))

    for (const file of files) {
      await import(path.join(routesPath, file))
    }
  }

  async boot(prefix: string = '/api') {
    await Connection.connect()
    await this.loadRoutes()

    this.app.use(prefix, Route.build())

    this.notFound()
    this.errorHandler()

    return this
  }

  private errorHandler() {
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      const isDev = process.env.APP_ENV === 'local' || process.env.APP_DEBUG === 'true'
      console.error(kleur.red(`[DarkStar Error] ${err.message}`))
      res.status(500).json({
        error: true,
        message: err.message,
        ...(isDev && { stack: err.stack }),
      })
    })
  }

  private notFound() {
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: true,
        message: `Rota não encontrada: ${req.method} ${req.originalUrl}`,
      })
    })
  }

  listen() {
    const port = Number(process.env.APP_PORT) || 3000
    const env  = process.env.APP_ENV  || 'local'
    const name = process.env.APP_NAME || 'DarkStar'

    this.app.listen(port, () => {
      console.log('')
      console.log(`  🪐 ${name} rodando`)
      console.log(`  ➜  Local:   http://localhost:${port}`)
      console.log(`  ➜  Env:     ${env}`)
      console.log('')
    })

    return this
  }

  getApp(): Application {
    return this.app
  }
}

export { TanisApp }