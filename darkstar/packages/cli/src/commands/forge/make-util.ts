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

function omitPasswordStub(name: string): string {
  return `export function omit${name}Password<T extends Record<string, any>>(obj: T): Omit<T, 'password'> {
  const { password, ...rest } = obj
  return rest
}
`
}

function twoFactorStub(name: string): string {
  return `import * as crypto from 'crypto'

/**
 * Gera um código TOTP simples de 6 dígitos para ${name}.
 * Em produção, prefira libs como 'otplib' para TOTP compliant com RFC 6238.
 */
export function generate${name}TwoFactorCode(): string {
  const code = crypto.randomInt(100000, 999999)
  return code.toString()
}

/**
 * Valida se o código informado corresponde ao código esperado para ${name}.
 */
export function validate${name}TwoFactorCode(inputCode: string, expectedCode: string): boolean {
  return inputCode.trim() === expectedCode.trim()
}
`
}

export function makeUtil(name: string) {
  const src = path.resolve(process.cwd(), 'src')
  const lower = name.toLowerCase()
  writeFile(path.join(src, 'utils', lower, 'omitPassword.ts'), omitPasswordStub(name))
  writeFile(path.join(src, 'utils', lower, 'twoFactor.ts'),    twoFactorStub(name))
}