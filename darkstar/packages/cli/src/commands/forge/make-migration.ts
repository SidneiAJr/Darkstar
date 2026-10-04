import kleur from 'kleur'
import * as fs from 'fs'
import * as path from 'path'

function success(msg: string) { console.log(kleur.green('  ✔ ') + msg) }
function error(msg: string)   { console.log(kleur.red('  ✘ ') + msg) }

function pluralize(word: string): string {
  if (word.endsWith('ch') || word.endsWith('sh') || word.endsWith('x') || word.endsWith('z') || word.endsWith('s')) {
    return word + 'es'
  }
  if (word.endsWith('y') && !['ay', 'ey', 'iy', 'oy', 'uy'].some(v => word.endsWith(v))) {
    return word.slice(0, -1) + 'ies'
  }
  return word + 's'
}

function extractTable(name: string): string {
  // create_products_table → products
  const match = name.match(/^create_(.+)_table$/)
  if (match) return match[1].toLowerCase()

  // fallback: pluraliza o nome direto
  return pluralize(name.toLowerCase())
}

export function makeMigration(name: string) {
  const timestamp = new Date().toISOString()
    .replace(/[-T:]/g, '_')
    .slice(0, 19)

  const table    = extractTable(name)
  const fileName = `${timestamp}_${name}.ts`
  const migrationsDir = path.resolve(process.cwd(), 'database/migrations')
  const filePath = path.join(migrationsDir, fileName)

  fs.mkdirSync(migrationsDir, { recursive: true })

  const content = `import type { BaseDriver } from '@darkstar/orm'
import { Schema, Blueprint } from '@darkstar/orm'

export async function up(driver: BaseDriver): Promise<void> {
  const schema = new Schema(driver)

  await schema.create('${table}', (table: Blueprint) => {
    table.id()
    table.timestamps()
  })
}

export async function down(driver: BaseDriver): Promise<void> {
  const schema = new Schema(driver)
  await schema.drop('${table}')
}
`

  fs.writeFileSync(filePath, content, 'utf-8')
  success(`Migration criada: database/migrations/${fileName}`)
}