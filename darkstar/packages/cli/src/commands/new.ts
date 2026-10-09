import kleur from 'kleur'
import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

function log(msg: string)     { console.log(msg) }
function success(msg: string) { log(kleur.green('  ✔ ') + msg) }
function info(msg: string)    { log(kleur.cyan('  → ') + msg) }
function error(msg: string)   { log(kleur.red('  ✘ ') + msg) }

function write(filePath: string, content: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, 'utf-8')
}

function generateStructure(projectPath: string, projectName: string) {
  // Diretórios vazios (com .gitkeep)
  const dirs = [
    'src/controllers',
    'src/services',
    'src/repositories',
    'src/models',
    'src/routes',
    'src/schemas',
    'src/middlewares',
    'src/utils',
    'database/migrations',
    'database/seeders',
  ]
  for (const dir of dirs) {
    const full = path.join(projectPath, dir)
    fs.mkdirSync(full, { recursive: true })
    fs.writeFileSync(path.join(full, '.gitkeep'), '')
  }

  // src/core/app.ts
  write(path.join(projectPath, 'src/core/app.ts'), `import 'dotenv/config'
import { DarkstarApp } from '@darkstar-cli/core'

const app = new DarkstarApp()

app.boot('/api').then(() => {
  const port = process.env.PORT ?? 3000
  app.listen(Number(port), () => {
    console.log(\`🪐 DarkStar rodando em http://localhost:\${port}\`)
  })
})
`)

  // database/seeders/Seeder.ts
  write(path.join(projectPath, 'database/seeders/Seeder.ts'), `export abstract class Seeder {
  abstract run(): Promise<void>
}
`)

  // database/seeders/DatabaseSeeder.ts
  write(path.join(projectPath, 'database/seeders/DatabaseSeeder.ts'), `import { Seeder } from './Seeder'

export class DatabaseSeeder extends Seeder {
  async run(): Promise<void> {
    // registre seus seeders aqui
  }
}
`)

  // darkstar.config.ts
  write(path.join(projectPath, 'darkstar.config.ts'), `import type { DarkstarConfig } from '@darkstar-cli/core'

const config: DarkstarConfig = {
  db: {
    client:   process.env.DB_CLIENT   as 'mysql' | 'pg' | 'sqlite3' ?? 'mysql',
    host:     process.env.DB_HOST     ?? '127.0.0.1',
    port:     Number(process.env.DB_PORT ?? 3306),
    user:     process.env.DB_USER     ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_DATABASE ?? '${projectName}',
  },
}

export default config
`)

  // tsconfig.json
  write(path.join(projectPath, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      target: 'ES2020',
      module: 'commonjs',
      lib: ['ES2020'],
      outDir: './dist',
      rootDir: './src',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
      emitDecoratorMetadata: false,
      experimentalDecorators: false,
    },
    include: ['src/**/*', 'darkstar.config.ts'],
    exclude: ['node_modules', 'dist'],
  }, null, 2))

  // .gitignore
  write(path.join(projectPath, '.gitignore'), `node_modules/
dist/
.env
*.log
`)

  // .env.example / .env
  const env = `DB_CLIENT=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_DATABASE=${projectName}
PORT=3000
`
  write(path.join(projectPath, '.env.example'), env)
  write(path.join(projectPath, '.env'), env)
}

function generatePackageJson(projectPath: string, projectName: string) {
  const pkg = {
    name: projectName,
    version: '0.0.1',
    description: '',
    main: 'dist/core/app.js',
    scripts: {
      dev:   'tsx src/core/app.ts',
      build: 'tsc',
      start: 'node dist/core/app.js',
    },
    dependencies: {
      '@darkstar-cli/core':      'latest',
      '@darkstar-cli/orm':       'latest',
      'dotenv':                  'latest',
      'express':                 'latest',
      'express-rate-limit':      'latest',
      'zod':                     'latest',
    },
    devDependencies: {
      '@types/express':            'latest',
      '@types/express-rate-limit': 'latest',
      '@types/node':               'latest',
      'tsx':                       'latest',
      'typescript':                'latest',
    },
  }
  write(path.join(projectPath, 'package.json'), JSON.stringify(pkg, null, 2))
}

function installDeps(projectPath: string) {
  info('Instalando dependências...')
  try {
    execSync('npm install --ignore-scripts', { cwd: projectPath, stdio: 'inherit' })
  } catch {
    error('Falha ao instalar dependências. Rode npm install manualmente.')
  }
}

export async function runNew(name: string) {
  console.log('')
  console.log(kleur.magenta('  DarkStar — Backend Framework for Node.js'))
  console.log(kleur.gray(`  Criando projeto: ${name}`))
  console.log('')

  const projectPath = path.resolve(process.cwd(), name)

  if (fs.existsSync(projectPath)) {
    error(`A pasta "${name}" já existe.`)
    process.exit(1)
  }

  info('Gerando estrutura do projeto...')
  generateStructure(projectPath, name)
  success('Estrutura criada')

  info('Configurando package.json...')
  generatePackageJson(projectPath, name)
  success('package.json configurado')

  installDeps(projectPath)

  console.log('')
  success('Projeto criado com sucesso!')
  console.log('')
  console.log(kleur.gray('  Próximos passos:'))
  console.log(kleur.cyan(`    cd ${name}`))
  console.log(kleur.cyan('    darkstar serve'))
  console.log('')
}