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

// ─── Migration parser ────────────────────────────────────────────────────────

function extractFieldsFromMigration(name: string): Record<string, string> | null {
  const migrationsDir = path.resolve(process.cwd(), 'database/migrations')
  if (!fs.existsSync(migrationsDir)) return null

  const tableName = name.toLowerCase() + 's'
  const files = fs.readdirSync(migrationsDir)
  const migrationFile = files.find(f => {
    const lower = f.toLowerCase()
    return (
      lower.includes(`create_${tableName}_table`) ||
      lower.includes(`create${tableName}table`) ||
      lower.includes(name.toLowerCase())
    )
  })

  if (!migrationFile) return null

  const content = fs.readFileSync(path.join(migrationsDir, migrationFile), 'utf-8')

  const SKIP = new Set(['id', 'timestamps', 'softDeletes', 'created_at', 'updated_at', 'deleted_at'])
  const fieldRegex = /table\.(\w+)\(\s*['"](\w+)['"]/g
  const fields: Record<string, string> = {}

  let match
  while ((match = fieldRegex.exec(content)) !== null) {
    const [, type, column] = match
    if (!SKIP.has(column)) fields[column] = type
  }

  return Object.keys(fields).length > 0 ? fields : null
}

// ─── Fake value por nome/tipo ────────────────────────────────────────────────

function fakeValue(column: string, type: string, name: string): string {
  if (column === 'password')    return "await bcrypt.hash('password', 10)"
  if (column === 'email')       return '`user${i}@darkstar.dev`'
  if (column === 'name')        return `\`${name} \${i}\``
  if (column === 'role')        return "i === 1 ? 'admin' : 'user'"
  if (column.endsWith('_at'))   return 'new Date()'
  if (column.endsWith('_id'))   return 'i'

  switch (type) {
    case 'string':              return `\`${column}_\${i}\``
    case 'text':                return `\`Lorem ipsum ${column} \${i}\``
    case 'integer':
    case 'bigInteger':
    case 'float':
    case 'decimal':             return 'i'
    case 'boolean':             return 'true'
    case 'date':
    case 'dateTime':
    case 'timestamp':           return 'new Date()'
    default:                    return `\`${column}_\${i}\``
  }
}

// ─── Stubs ───────────────────────────────────────────────────────────────────

function stub(name: string): string {
  const fields = extractFieldsFromMigration(name)
  const needsBcrypt = !!fields && 'password' in fields

  const bcryptImport = needsBcrypt ? "\nimport bcrypt     from 'bcrypt'" : ''

  let fieldsBlock: string
  if (fields && Object.keys(fields).length > 0) {
    const longest = Math.max(...Object.keys(fields).map(k => k.length))
    fieldsBlock = Object.entries(fields)
      .map(([col, type]) => `        ${col.padEnd(longest)}: ${fakeValue(col, type, name)},`)
      .join('\n')
  } else {
    fieldsBlock = `        // insira os campos aqui`
  }

  return `import { Seeder } from './Seeder'
import { ${name} } from '../../src/models/${name}'${bcryptImport}

export class ${name}Seeder extends Seeder {
  async run(): Promise<void> {
    for (let i = 1; i <= 10; i++) {
      await ${name}.create({
${fieldsBlock}
      })
    }
  }
}
`
}

// ─── Register ────────────────────────────────────────────────────────────────

function registerSeeder(seedersDir: string, name: string) {
  const dbSeederPath = path.join(seedersDir, 'DatabaseSeeder.ts')
  if (!fs.existsSync(dbSeederPath)) return

  let content = fs.readFileSync(dbSeederPath, 'utf-8')

  const importLine   = `import { ${name}Seeder } from './${name}Seeder'`
  const instanceLine = `new ${name}Seeder(),`

  if (content.includes(importLine)) return

  content = importLine + '\n' + content
  content = content.replace(
    /\/\/ registre seus seeders aqui/,
    `// registre seus seeders aqui\n    ${instanceLine}`
  )

  fs.writeFileSync(dbSeederPath, content, 'utf-8')
  success(`Seeder registrado em DatabaseSeeder.ts`)
}

// ─── Entry point ─────────────────────────────────────────────────────────────

export function makeSeeder(name: string) {
  const seedersDir = path.resolve(process.cwd(), 'database/seeders')
  writeFile(path.join(seedersDir, `${name}Seeder.ts`), stub(name))
  registerSeeder(seedersDir, name)
}