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

// ─── Stub ─────────────────────────────────────────────────────────────────────

function stubRateLimit(): string {
  return `import rateLimit from 'express-rate-limit'

// ─── Auth ─────────────────────────────────────────────────────────────────────

/** /auth/login — 3 tentativas por 15 min */
export const loginLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             3,
  message:         { message: 'Você tem 3 tentativas de login. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders:   false,
})

/** /auth/register — 5 tentativas por 15 min */
export const registerLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             5,
  message:         { message: 'Muitas tentativas de registro. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders:   false,
})

/** /auth/forgot-password — 3 tentativas por hora */
export const forgotPasswordLimiter = rateLimit({
  windowMs:        60 * 60 * 1000,
  max:             3,
  message:         { message: 'Muitas tentativas de recuperação de senha. Tente novamente em 1 hora.' },
  standardHeaders: true,
  legacyHeaders:   false,
})

/** /auth/reset-password — 5 tentativas por hora */
export const resetPasswordLimiter = rateLimit({
  windowMs:        60 * 60 * 1000,
  max:             5,
  message:         { message: 'Muitas tentativas de redefinição de senha. Tente novamente em 1 hora.' },
  standardHeaders: true,
  legacyHeaders:   false,
})

/** /auth/refresh-token — 10 tentativas por 15 min */
export const refreshTokenLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             10,
  message:         { message: 'Muitas tentativas de renovação de token. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders:   false,
})

/** /auth/verify-email — 5 tentativas por hora */
export const verifyEmailLimiter = rateLimit({
  windowMs:        60 * 60 * 1000,
  max:             5,
  message:         { message: 'Muitas tentativas de verificação de e-mail. Tente novamente em 1 hora.' },
  standardHeaders: true,
  legacyHeaders:   false,
})

/** /auth/two-factor — 5 tentativas por 15 min */
export const twoFactorLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             5,
  message:         { message: 'Muitas tentativas de autenticação em dois fatores. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders:   false,
})

// ─── API Geral ────────────────────────────────────────────────────────────────

/** /api/* global — 100 req por 15 min */
export const globalLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             100,
  message:         { message: 'Muitas requisições. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders:   false,
})

/** leitura geral (GET) — 200 req por minuto */
export const readLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             200,
  message:         { message: 'Muitas requisições de leitura. Tente novamente em 1 minuto.' },
  standardHeaders: true,
  legacyHeaders:   false,
})

/** escrita geral (POST/PUT/PATCH) — 30 req por minuto */
export const writeLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             30,
  message:         { message: 'Muitas requisições de escrita. Tente novamente em 1 minuto.' },
  standardHeaders: true,
  legacyHeaders:   false,
})

/** deleção (DELETE) — 10 req por minuto */
export const deleteLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             10,
  message:         { message: 'Muitas tentativas de exclusão. Tente novamente em 1 minuto.' },
  standardHeaders: true,
  legacyHeaders:   false,
})

// ─── Arquivos ─────────────────────────────────────────────────────────────────

/** upload de arquivos — 10 req por minuto */
export const uploadLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             10,
  message:         { message: 'Muitos uploads. Tente novamente em 1 minuto.' },
  standardHeaders: true,
  legacyHeaders:   false,
})

/** download/export — 20 req por minuto */
export const downloadLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             20,
  message:         { message: 'Muitos downloads. Tente novamente em 1 minuto.' },
  standardHeaders: true,
  legacyHeaders:   false,
})

// ─── Tempo Real ───────────────────────────────────────────────────────────────

/** SSE / Server-Sent Events — 5 conexões por minuto */
export const sseLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             5,
  message:         { message: 'Muitas conexões SSE. Tente novamente em 1 minuto.' },
  standardHeaders: true,
  legacyHeaders:   false,
})

/** WebSocket handshake — 10 por minuto */
export const websocketLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             10,
  message:         { message: 'Muitas conexões WebSocket. Tente novamente em 1 minuto.' },
  standardHeaders: true,
  legacyHeaders:   false,
})

// ─── Comunicação ──────────────────────────────────────────────────────────────

/** envio de e-mail (contato, notificação) — 5 por hora */
export const emailLimiter = rateLimit({
  windowMs:        60 * 60 * 1000,
  max:             5,
  message:         { message: 'Muitos e-mails enviados. Tente novamente em 1 hora.' },
  standardHeaders: true,
  legacyHeaders:   false,
})

/** envio de SMS — 3 por hora */
export const smsLimiter = rateLimit({
  windowMs:        60 * 60 * 1000,
  max:             3,
  message:         { message: 'Muitos SMS enviados. Tente novamente em 1 hora.' },
  standardHeaders: true,
  legacyHeaders:   false,
})

/** webhook recebido — 50 por minuto */
export const webhookLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             50,
  message:         { message: 'Muitas chamadas de webhook. Tente novamente em 1 minuto.' },
  standardHeaders: true,
  legacyHeaders:   false,
})

// ─── Busca e Relatórios ───────────────────────────────────────────────────────

/** busca/search — 30 req por minuto */
export const searchLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             30,
  message:         { message: 'Muitas buscas. Tente novamente em 1 minuto.' },
  standardHeaders: true,
  legacyHeaders:   false,
})

/** relatórios/stats — 20 req por minuto */
export const statsLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             20,
  message:         { message: 'Muitas requisições de estatísticas. Tente novamente em 1 minuto.' },
  standardHeaders: true,
  legacyHeaders:   false,
})

/** exportação de relatório (PDF/Excel) — 5 por minuto */
export const reportLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             5,
  message:         { message: 'Muitas exportações de relatório. Tente novamente em 1 minuto.' },
  standardHeaders: true,
  legacyHeaders:   false,
})

// ─── Admin ────────────────────────────────────────────────────────────────────

/** painel admin — 200 req por 15 min */
export const adminLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             200,
  message:         { message: 'Muitas requisições no painel admin. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders:   false,
})

/** ações destrutivas admin (delete em massa, truncate) — 5 por hora */
export const adminDestructiveLimiter = rateLimit({
  windowMs:        60 * 60 * 1000,
  max:             5,
  message:         { message: 'Muitas ações destrutivas. Tente novamente em 1 hora.' },
  standardHeaders: true,
  legacyHeaders:   false,
})

// ─── Pagamentos ───────────────────────────────────────────────────────────────

/** checkout/pagamento — 10 por 15 min */
export const paymentLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             10,
  message:         { message: 'Muitas tentativas de pagamento. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders:   false,
})

/** reembolso — 3 por hora */
export const refundLimiter = rateLimit({
  windowMs:        60 * 60 * 1000,
  max:             3,
  message:         { message: 'Muitas solicitações de reembolso. Tente novamente em 1 hora.' },
  standardHeaders: true,
  legacyHeaders:   false,
})
`
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export function makeSecurity() {
  const middlewaresDir = path.resolve(process.cwd(), 'src/middlewares')
  writeFile(path.join(middlewaresDir, 'RateLimitMiddleware.ts'), stubRateLimit())
  console.log('')
  console.log(kleur.yellow('  ⚠ Instale a dependência:'))
  console.log(kleur.cyan('    npm install express-rate-limit'))
  console.log('')
  console.log(kleur.yellow('  ⚠ Uso nas rotas:'))
  console.log(kleur.cyan("    import { loginLimiter, globalLimiter } from '../middlewares/RateLimitMiddleware'"))
  console.log(kleur.cyan("    router.post('/auth/login', loginLimiter, ...)"))
}