import kleur from 'kleur'
import { execSync } from 'child_process'

function success(msg: string) { console.log(kleur.green('  ✔ ') + msg) }
function info(msg: string)    { console.log(kleur.cyan('  → ') + msg) }
function error(msg: string)   { console.log(kleur.red('  ✘ ') + msg) }

interface Dep {
  packages: string[]
  dev?:     string[]
  desc:     string
}

const DEPS: Record<string, Record<string, Dep>> = {

  'Autenticação': {
    jwt: {
      packages: ['jsonwebtoken'],
      dev:      ['@types/jsonwebtoken'],
      desc:     'Geração e verificação de tokens JWT',
    },
    bcrypt: {
      packages: ['bcrypt'],
      dev:      ['@types/bcrypt'],
      desc:     'Hash de senhas',
    },
    otplib: {
      packages: ['otplib'],
      desc:     '2FA compatível com Google Authenticator',
    },
    passport: {
      packages: ['passport', 'passport-local', 'passport-jwt'],
      dev:      ['@types/passport', '@types/passport-local', '@types/passport-jwt'],
      desc:     'Autenticação por estratégias (local, JWT, OAuth...)',
    },
  },

  'Validação': {
    zod: {
      packages: ['zod'],
      desc:     'Validação e parsing de schemas com TypeScript-first',
    },
    yup: {
      packages: ['yup'],
      desc:     'Validação de schemas estilo fluent',
    },
    joi: {
      packages: ['joi'],
      desc:     'Validação de objetos poderosa e flexível',
    },
    'class-validator': {
      packages: ['class-validator', 'class-transformer'],
      desc:     'Validação via decoradores em classes TypeScript',
    },
  },

  'Upload & Arquivos': {
    multer: {
      packages: ['multer'],
      dev:      ['@types/multer'],
      desc:     'Upload de arquivos multipart/form-data',
    },
    sharp: {
      packages: ['sharp'],
      desc:     'Processamento e redimensionamento de imagens',
    },
    'pdf-lib': {
      packages: ['pdf-lib'],
      desc:     'Criação e edição de PDFs',
    },
  },

  'Email': {
    nodemailer: {
      packages: ['nodemailer'],
      dev:      ['@types/nodemailer'],
      desc:     'Envio de e-mails via SMTP',
    },
    resend: {
      packages: ['resend'],
      desc:     'Envio de e-mails via API Resend',
    },
  },

  'HTTP & Rede': {
    cors: {
      packages: ['cors'],
      dev:      ['@types/cors'],
      desc:     'Habilita CORS nas rotas',
    },
    axios: {
      packages: ['axios'],
      desc:     'Cliente HTTP para consumir APIs externas',
    },
    helmet: {
      packages: ['helmet'],
      desc:     'Headers de segurança HTTP',
    },
    'rate-limiter': {
      packages: ['express-rate-limit'],
      desc:     'Rate limiting por IP',
    },
  },

  'Logs': {
    winston: {
      packages: ['winston'],
      desc:     'Logger estruturado com níveis e transports',
    },
    pino: {
      packages: ['pino', 'pino-pretty'],
      desc:     'Logger de alta performance com output JSON',
    },
    morgan: {
      packages: ['morgan'],
      dev:      ['@types/morgan'],
      desc:     'Logger de requisições HTTP',
    },
  },

  'Banco de Dados': {
    redis: {
      packages: ['ioredis'],
      dev:      ['@types/ioredis'],
      desc:     'Cliente Redis para cache e filas',
    },
    mongoose: {
      packages: ['mongoose'],
      desc:     'ODM para MongoDB',
    },
    prisma: {
      packages: ['prisma', '@prisma/client'],
      desc:     'ORM moderno com migrations e type safety',
    },
  },

  'Utilitários': {
    uuid: {
      packages: ['uuid'],
      dev:      ['@types/uuid'],
      desc:     'Geração de UUIDs',
    },
    dayjs: {
      packages: ['dayjs'],
      desc:     'Manipulação de datas leve e imutável',
    },
    lodash: {
      packages: ['lodash'],
      dev:      ['@types/lodash'],
      desc:     'Utilitários para arrays, objetos e strings',
    },
    dotenv: {
      packages: ['dotenv'],
      desc:     'Carrega variáveis de ambiente do .env',
    },
  },

}

// índice flat pra busca por nome
const FLAT: Record<string, Dep> = {}
for (const cat of Object.values(DEPS)) {
  for (const [key, dep] of Object.entries(cat)) {
    FLAT[key] = dep
  }
}

function install(packages: string[], dev = false) {
  const flag = dev ? '--save-dev' : '--save'
  const list = packages.map(p => `${p}@latest`).join(' ')
  execSync(`npm install ${flag} ${list}`, { stdio: 'inherit' })
}

function listAll() {
  for (const [category, deps] of Object.entries(DEPS)) {
    console.log(kleur.magenta(`\n  ${category}`))
    for (const [key, dep] of Object.entries(deps)) {
      console.log(
        kleur.cyan(`    ${key.padEnd(18)}`),
        kleur.gray(dep.desc)
      )
    }
  }
  console.log('')
  console.log(kleur.gray('  Uso: darkstar forge make:deps bcrypt winston zod'))
  console.log('')
}

export function makeDeps(names: string[]) {
  console.log('')
  console.log(kleur.magenta('  DarkStar — Instalador de dependências'))
  console.log('')

  if (names.length === 0) {
    listAll()
    return
  }

  for (const name of names) {
    const dep = FLAT[name]

    if (!dep) {
      error(`Dependência desconhecida: "${name}" — rode sem argumentos pra ver a lista`)
      continue
    }

    info(`Instalando ${name}...`)

    try {
      install(dep.packages)
      if (dep.dev?.length) install(dep.dev, true)
      success(`${name} instalado`)
    } catch {
      error(`Falha ao instalar ${name}. Rode manualmente: npm install ${dep.packages.join(' ')}`)
    }
  }

  console.log('')
  success('Pronto!')
  console.log('')
}