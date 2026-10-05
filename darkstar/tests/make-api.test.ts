import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

// -----------------------------------------------
// Importa as funções internas que precisamos testar.
// Como são locais ao arquivo make-api.ts, extraímos
// a lógica pura para um helper testável.
// -----------------------------------------------

// Re-implementação local de pluralize para teste isolado
// (cópia fiel do make-api.ts)
function pluralize(word: string): string {
  if (
    word.endsWith('ch') || word.endsWith('sh') ||
    word.endsWith('x')  || word.endsWith('z')  ||
    word.endsWith('s')
  ) return word + 'es'

  if (word.endsWith('y') && !['ay', 'ey', 'iy', 'oy', 'uy'].some(v => word.endsWith(v))) {
    return word.slice(0, -1) + 'ies'
  }

  return word + 's'
}

// -----------------------------------------------
// pluralize
// -----------------------------------------------

describe('pluralize()', () => {
  it('palavra comum → +s', () => {
    expect(pluralize('user')).toBe('users')
    expect(pluralize('product')).toBe('products')
    expect(pluralize('order')).toBe('orders')
  })

  it('termina em -ch → +es', () => {
    expect(pluralize('watch')).toBe('watches')
    expect(pluralize('batch')).toBe('batches')
  })

  it('termina em -sh → +es', () => {
    expect(pluralize('wish')).toBe('wishes')
  })

  it('termina em -x → +es', () => {
    expect(pluralize('box')).toBe('boxes')
    expect(pluralize('index')).toBe('indexes')
  })

  it('termina em -z → +es', () => {
    expect(pluralize('buzz')).toBe('buzzes')
  })

  it('termina em -s → +es', () => {
    expect(pluralize('status')).toBe('statuses')
  })

  it('termina em -y com consoante antes → -ies', () => {
    expect(pluralize('category')).toBe('categories')
    expect(pluralize('city')).toBe('cities')
  })

  it('termina em vogal+y → +s (não troca por -ies)', () => {
    expect(pluralize('day')).toBe('days')
    expect(pluralize('key')).toBe('keys')
    expect(pluralize('boy')).toBe('boys')
    expect(pluralize('guy')).toBe('guys')
  })
})

// -----------------------------------------------
// Geração de arquivos com makeApi()
// Usa um diretório temporário real em disco
// -----------------------------------------------

describe('makeApi() — geração de arquivos', async () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'darkstar-test-'))
    // Cria estrutura mínima esperada pelo makeApi
    for (const dir of ['controllers', 'services', 'repositories', 'models', 'routes', 'schemas', 'middlewares', 'core']) {
      fs.mkdirSync(path.join(tmpDir, 'src', dir), { recursive: true })
    }
    // app.ts mínimo para o registerRoute não quebrar
    fs.writeFileSync(
      path.join(tmpDir, 'src', 'core', 'app.ts'),
      `import { App } from '@darkstar/core'\nexport const app = new App()\n`
    )
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('cria todos os 7 arquivos esperados', async () => {
    // Substitui process.cwd() pelo tmpDir
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)

    const { makeApi } = await import('../packages/cli/src/commands/forge/make-api')
    makeApi('Post')

    cwdSpy.mockRestore()

    const expected = [
      path.join(tmpDir, 'src', 'controllers',  'PostController.ts'),
      path.join(tmpDir, 'src', 'services',     'PostService.ts'),
      path.join(tmpDir, 'src', 'repositories', 'PostRepository.ts'),
      path.join(tmpDir, 'src', 'models',       'Post.ts'),
      path.join(tmpDir, 'src', 'routes',       'posts.ts'),
      path.join(tmpDir, 'src', 'schemas',      'PostSchema.ts'),
      path.join(tmpDir, 'src', 'middlewares',  'PostMiddleware.ts'),
    ]

    for (const file of expected) {
      expect(fs.existsSync(file), `Arquivo não criado: ${file}`).toBe(true)
    }
  })

  it('Controller gerado importa o Service correto', async () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    const { makeApi } = await import('../packages/cli/src/commands/forge/make-api')
    makeApi('Invoice')
    cwdSpy.mockRestore()

    const content = fs.readFileSync(
      path.join(tmpDir, 'src', 'controllers', 'InvoiceController.ts'), 'utf-8'
    )
    expect(content).toContain("import { InvoiceService } from '../services/InvoiceService'")
    expect(content).toContain('class InvoiceController')
  })

  it('Repository gerado usa o Model correto', async () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    const { makeApi } = await import('../packages/cli/src/commands/forge/make-api')
    makeApi('Invoice')
    cwdSpy.mockRestore()

    const content = fs.readFileSync(
      path.join(tmpDir, 'src', 'repositories', 'InvoiceRepository.ts'), 'utf-8'
    )
    expect(content).toContain("import { Invoice } from '../models/Invoice'")
    expect(content).toContain('Invoice.findAll()')
  })

  it('Model gerado usa a tabela pluralizada correta', async () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    const { makeApi } = await import('../packages/cli/src/commands/forge/make-api')
    makeApi('Category')
    cwdSpy.mockRestore()

    const content = fs.readFileSync(
      path.join(tmpDir, 'src', 'models', 'Category.ts'), 'utf-8'
    )
    expect(content).toContain("static table = 'categories'")
  })

  it('não sobrescreve arquivo já existente', async () => {
    const controllerPath = path.join(tmpDir, 'src', 'controllers', 'UserController.ts')
    fs.writeFileSync(controllerPath, '// original')

    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    const { makeApi } = await import('../packages/cli/src/commands/forge/make-api')
    makeApi('User')
    cwdSpy.mockRestore()

    expect(fs.readFileSync(controllerPath, 'utf-8')).toBe('// original')
  })

  it('registra a rota no app.ts', async () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    const { makeApi } = await import('../packages/cli/src/commands/forge/make-api')
    makeApi('Payment')
    cwdSpy.mockRestore()

    const appContent = fs.readFileSync(
      path.join(tmpDir, 'src', 'core', 'app.ts'), 'utf-8'
    )
    expect(appContent).toContain("import '../routes/payments'")
  })
})