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
    if (entry.name.endsWith('.stub')) continue

    const srcPath  = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      copyTemplate(srcPath, destPath)
    } else {
      const destName = entry.name === 'tanis.config.ts' ? 'darkstar.config.ts' : entry.name
      fs.copyFileSync(srcPath, path.join(dest, destName))
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
    env = env.replace(/^DB_DATABASE=.*/m, 'DB_DATABASE=darkstar')
  } else {
    env = env.replace(/^DB_PORT=.*/m, 'DB_PORT=5432')
    env = env.replace(/^DB_DATABASE=.*/m, 'DB_DATABASE=darkstar')
  }

  fs.writeFileSync(envPath, env, 'utf-8')
  fs.copyFileSync(envPath, path.join(projectPath, '.env'))
}

function configurePackageJson(projectPath: string, projectName: string) {
  const pkgPath = path.join(projectPath, 'package.json')
  const monorepoRoot = path.resolve(__dirname, '../../../../')

  const deps: Record<string, string> = {
    '@darkstar/core': `file:${path.join(monorepoRoot, 'packages/core').replace(/\\/g, '/')}`,
    '@darkstar/orm':  `file:${path.join(monorepoRoot, 'packages/orm').replace(/\\/g, '/')}`,
    'dotenv':         'latest',
    'express':        'latest',
    'zod':            'latest',
  }

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
    dependencies: deps,
    devDependencies: {
      '@types/express': 'latest',
      '@types/node':    'latest',
      'tsx':            'latest',
      'typescript':     'latest',
    },
  }

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf-8')
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

  const answers = await inquirer.prompt([
    {
      type: 'select',
      name: 'db',
      message: 'Qual banco de dados?',
      choices: [
        { name: 'MySQL',      value: 'mysql'    },
        { name: 'PostgreSQL', value: 'postgres' },
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
  configurePackageJson(projectPath, name)
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