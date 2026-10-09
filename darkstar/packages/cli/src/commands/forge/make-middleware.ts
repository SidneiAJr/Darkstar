import kleur from 'kleur'
import * as fs from 'fs'
import * as path from 'path'

function success(msg: string) { console.log(kleur.green('  ✔ ') + msg) }
function error(msg: string)   { console.log(kleur.red('  ✘ ') + msg) }

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true })
}

function writeFile(filePath: string, content: string) {
  if (fs.existsSync(filePath)) { error(`Arquivo já existe: ${filePath}`); return }
  ensureDir(path.dirname(filePath))
  fs.writeFileSync(filePath, content, 'utf-8')
  success(`Criado: ${filePath}`)
}

function stub(name: string): string {
  return `import { DarkstarRequest, DarkstarResponse, NextFunction } from '@darkstar-cli/core'

export class ${name}Middleware {
  handle(req: DarkstarRequest, res: DarkstarResponse, next: NextFunction) {
    next()
  }
}
`
}

export function makeMiddleware(name: string) {
  const src = path.resolve(process.cwd(), 'src')
  writeFile(path.join(src, 'middlewares', `${name}Middleware.ts`), stub(name))
}