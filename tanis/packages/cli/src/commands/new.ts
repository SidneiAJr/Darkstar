import inquirer from 'inquirer'
import kleur from 'kleur'
import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

function log(msg: string)     { console.log(msg) }
function success(msg: string) { log(kleur.green('  ✔ ') + msg) }
function info(msg: string)    { log(kleur.cyan('  → ') + msg) }
function error(msg: string)   { log(kleur.red('  ✘ ') + msg) }

function copyTemplate(src: string, dest: string) {
  if (!fs.existsSync(src)) {
    error(`Template não encontrado em: ${src}`)
    process.exit(1)
  }

  fs.mkdirSync(dest, { recursive: true })

  const entries = fs.readdirSync(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath  = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      copyTemplate(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

function configureEnv(projectPath: string, db: string) {
  const envPath = path.join(projectPath, '.env.example')
  if (!fs.existsSync(envPath)) return

  let env = fs.readFileSync(envPath, 'utf-8')

  env = env.replace(/^DB_CONNECTION=.*/m, `DB_CONNECTION=${db}`)

  if (db === 'mysql') {
    env = env.replace(/^DB_PORT=.*/m, 'DB_PORT=3306')
    env = env.replace(/^DB_DATABASE=.*/m, 'DB_DATABASE=tanis')
  } else if (db === 'postgres') {
    env = env.replace(/^DB_PORT=.*/m, 'DB_PORT=5432')
    env = env.replace(/^DB_DATABASE=.*/m, 'DB_DATABASE=tanis')
  } else {
    env = env.replace(/^DB_PORT=.*/m, 'DB_PORT=')
    env = env.replace(/^DB_DATABASE=.*/m, 'DB_DATABASE=database.sqlite')
  }

  fs.writeFileSync(envPath, env, 'utf-8')
  fs.copyFileSync(envPath, path.join(projectPath, '.env'))
}

function configurePackageJson(projectPath: string, projectName: string, orm: string) {
  const pkgPath = path.join(projectPath, 'package.json')

  const monorepoRoot = path.resolve(__dirname, '../../../../')

  const deps: Record<string, string> = {
    '@tanis/core': `file:${path.join(monorepoRoot, 'packages/core').replace(/\\/g, '/')}`,
    'dotenv':      '^16.0.0',
    'express':     '^5.2.1',
    'zod':         '^4.6.5',
  }

  if (orm === 'typeorm') {
    deps['typeorm']          = '^0.3.0'
    deps['reflect-metadata'] = '^0.2.0'
  } else {
    deps['@tanis/orm'] = `file:${path.join(monorepoRoot, 'packages/orm').replace(/\\/g, '/')}`
  }

  const pkg = {
    name: projectName,
    version: '0.0.1',
    description: '',
    main: 'dist/core/app.js',
    scripts: {
      dev:   'ts-node src/core/app.ts',
      build: 'tsc',
      start: 'node dist/core/app.js',
    },
    dependencies: deps,
    devDependencies: {
      '@types/express': '^5.0.6',
      '@types/node':    '^26.0.0',
      'ts-node':        '^10.9.2',
      'typescript':     '^6.0.0',
    },
  }

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf-8')
}

function installDeps(projectPath: string) {
  info('Instalando dependências...')
  try {
    execSync('npm install', { cwd: projectPath, stdio: 'inherit' })
  } catch {
    error('Falha ao instalar dependências. Rode npm install manualmente.')
  }
}

export async function runNew(name: string) {
  console.log('')
  console.log(kleur.magenta('  Tanis — Backend Framework for Node.js'))
  console.log(kleur.gray(`  Criando projeto: ${name}`))
  console.log('')

  const answers = await inquirer.prompt([
    {
      type: 'select',
      name: 'db',
      message: 'Qual banco de dados?',
      choices: [
        { name: 'SQLite  (zero config, ideal pra dev)', value: 'sqlite'   },
        { name: 'MySQL',                                value: 'mysql'    },
        { name: 'PostgreSQL',                           value: 'postgres' },
      ],
    },
    {
      type: 'select',
      name: 'orm',
      message: 'Qual ORM?',
      choices: [
        { name: 'Tanis ORM  (estilo Eloquent, nativo)', value: 'tanis'   },
        { name: 'TypeORM',                              value: 'typeorm' },
      ],
    },
  ])

  console.log('')

  const projectPath = path.resolve(process.cwd(), name)

  if (fs.existsSync(projectPath)) {
    error(`A pasta "${name}" já existe.`)
    process.exit(1)
  }

  const templatePath = path.resolve(__dirname, '../../../../templates/project')

  info('Copiando estrutura do projeto...')
  copyTemplate(templatePath, projectPath)
  success('Estrutura criada')

  info('Configurando .env...')
  configureEnv(projectPath, answers.db)
  success('.env configurado')

  info('Configurando package.json...')
  configurePackageJson(projectPath, name, answers.orm)
  success('package.json configurado')

  installDeps(projectPath)

  console.log('')
  success('Projeto criado com sucesso!')
  console.log('')
  console.log(kleur.gray('  Próximos passos:'))
  console.log(kleur.cyan(`    cd ${name}`))
  console.log(kleur.cyan('    tanis serve'))
  console.log('')
}