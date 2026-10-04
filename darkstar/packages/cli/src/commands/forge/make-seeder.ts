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
  return `import { Seeder } from './Seeder'

export class ${name}Seeder extends Seeder {
  async run(): Promise<void> {
    // insira os dados aqui
  }
}
`
}

function registerSeeder(seedersDir: string, name: string) {
  const dbSeederPath = path.join(seedersDir, 'DatabaseSeeder.ts')
  if (!fs.existsSync(dbSeederPath)) return

  let content = fs.readFileSync(dbSeederPath, 'utf-8')

  const importLine = `import { ${name}Seeder } from './${name}Seeder'`
  const instanceLine = `new ${name}Seeder(),`

  if (content.includes(importLine)) return

  // adiciona o import no topo
  content = importLine + '\n' + content

  // registra no array de seeders
  content = content.replace(
    /\/\/ registre seus seeders aqui/,
    `// registre seus seeders aqui\n    ${instanceLine}`
  )

  fs.writeFileSync(dbSeederPath, content, 'utf-8')
  success(`Seeder registrado em DatabaseSeeder.ts`)
}

export function makeSeeder(name: string) {
  const seedersDir = path.resolve(process.cwd(), 'database/seeders')
  writeFile(path.join(seedersDir, `${name}Seeder.ts`), stub(name))
  registerSeeder(seedersDir, name)
}