import kleur from 'kleur'
import * as fs from 'fs'
import * as path from 'path'

function success(msg: string) { console.log(kleur.green('  ✔ ') + msg) }
function error(msg: string)   { console.log(kleur.red('  ✘ ') + msg) }

export function makeMigration(name: string) {
  const timestamp = new Date().toISOString()
    .replace(/[-T:]/g, '_')
    .slice(0, 19)

  const fileName = `${timestamp}_${name}.ts`
  const migrationsDir = path.resolve(process.cwd(), 'database/migrations')
  const filePath = path.join(migrationsDir, fileName)

  fs.mkdirSync(migrationsDir, { recursive: true })

  const content = `import type { BaseDriver } from '@darkstar/orm'
import { Schema, Blueprint } from '@darkstar/orm'

export async function up(driver: BaseDriver): Promise<void> {
  const schema = new Schema(driver)

  await schema.create('${name}', (table: Blueprint) => {
    table.id()
    table.timestamps()
  })
}

export async function down(driver: BaseDriver): Promise<void> {
  const schema = new Schema(driver)
  await schema.drop('${name}')
}
`

  fs.writeFileSync(filePath, content, 'utf-8')
  success(`Migration criada: database/migrations/${fileName}`)
}