> [!CAUTION]
> ## ⚠️ VERSÃO ALPHA — NÃO USE EM PRODUÇÃO
> O DarkStar está em **alpha inicial**. As APIs vão mudar sem aviso prévio. O pacote não é estável — use por sua conta e risco.

> [!NOTE]
> 📦 O DarkStar ainda não foi publicado no npm. O pacote está em fase de testes — a publicação acontecerá quando o core estiver estável.

# 🪐 DarkStar — Backend Framework for Node.js

> *"Forjado no vácuo. Construído para durar."*

> Inspirado na elegância do **Laravel** — reimaginado para o universo **Node.js**.

---

## Por que o DarkStar existe?

Sou fã de PHP. Primeira vez que vi o Laravel bati a cabeça e não entendi nada — mas quando entendi, pensei: *"isso é brilhante"*.

O NestJS tenta trazer essa experiência pro Node, mas na prática é verboso, cheio de decoradores e difícil de ler. O Express puro é flexível demais — você acaba construindo a mesma estrutura do zero em todo projeto.

O **DarkStar** nasceu pra resolver isso: um framework Node.js com a clareza e produtividade do Laravel, sem a bagunça do ecossistema.

---

## Filosofia

- **Convenção sobre configuração** — estrutura pronta, sem decisão desnecessária
- **MVC como cidadão de primeira classe** — Controller → Service → Repository é o padrão, não uma opinião
- **CLI que faz o trabalho pesado** — uma linha de comando gera toda a camada
- **Dependências centralizadas** — você atualiza o DarkStar, não 40 pacotes separados
- **ORM expressivo** — query builder fluido estilo Eloquent, não decoradores

---

## Instalação

```bash
npm install -g darkstar
```

---

## Criando um projeto

```bash
darkstar new meu-projeto
```

O CLI vai perguntar:
- Qual banco de dados? (MySQL · PostgreSQL)

Estrutura gerada:

```
meu-projeto/
├── src/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── models/
│   ├── routes/
│   ├── schemas/
│   ├── middlewares/
│   ├── utils/
│   └── core/
│       └── app.ts
├── database/
│   ├── migrations/
│   └── seeders/
│       ├── Seeder.ts
│       └── DatabaseSeeder.ts
├── .env
├── darkstar.config.ts
└── package.json
```

---

## CLI — DarkStar Forge

| Comando | Descrição |
|---|---|
| `darkstar new <nome>` | Cria um novo projeto |
| `darkstar serve` | Sobe o servidor de desenvolvimento |
| `darkstar forge make:api <Nome>` | Gera controller + service + repository + model + rotas + schema + middleware |
| `darkstar forge make:controller <Nome>` | Gera um Controller |
| `darkstar forge make:service <Nome>` | Gera um Service |
| `darkstar forge make:repository <Nome>` | Gera um Repository |
| `darkstar forge make:model <Nome>` | Gera um Model |
| `darkstar forge make:migration <Nome>` | Gera uma Migration |
| `darkstar forge make:seeder <Nome>` | Gera um Seeder (lê os campos da migration automaticamente) |
| `darkstar forge make:schema <Nome>` | Gera um Schema |
| `darkstar forge make:middleware <Nome>` | Gera um Middleware |
| `darkstar forge make:util <Nome>` | Gera utils de omitPassword e twoFactor |
| `darkstar forge make:security` | Gera o RateLimitMiddleware com limiters prontos |
| `darkstar forge db:create` | Cria o banco de dados |
| `darkstar forge db:migrate` | Roda as migrations pendentes |
| `darkstar forge db:rollback` | Desfaz a última migration |
| `darkstar forge db:seed` | Popula o banco com seeders |

---

## Fluxo recomendado do zero

```bash
# 1. Criar o banco de dados
darkstar forge db:create

# 2. Gerar a migration
darkstar forge make:migration CreateUsersTable

# 3. Editar o arquivo gerado em database/migrations/ com os campos desejados

# 4. Rodar a migration
darkstar forge db:migrate

# 5. Gerar a API completa
darkstar forge make:api User

# 6. Gerar o seeder (já lê os campos da migration automaticamente)
darkstar forge make:seeder User

# 7. Popular o banco
darkstar forge db:seed

# 8. Gerar os utils
darkstar forge make:util User

# 9. Gerar os rate limiters de segurança
darkstar forge make:security

# 10. Subir o servidor
darkstar serve
```

---

## Estrutura gerada pelo `make:api`

Um único comando `darkstar forge make:api User` gera toda a cadeia MVC:

**`UserController.ts`**

```typescript
import { DarkstarRequest, DarkstarResponse } from '@darkstar/core'
import { UserService } from '../services/UserService'

export class UserController {
  constructor(private userService: UserService) {}

  async index(req: DarkstarRequest, res: DarkstarResponse) {
    const data = await this.userService.findAll()
    return res.ok(data)
  }

  async show(req: DarkstarRequest, res: DarkstarResponse) {
    const data = await this.userService.findById(req.param('id')!)
    if (!data) return res.notFound('User não encontrado')
    return res.ok(data)
  }

  async store(req: DarkstarRequest, res: DarkstarResponse) {
    const data = await this.userService.create(req.all())
    return res.created(data)
  }

  async update(req: DarkstarRequest, res: DarkstarResponse) {
    const data = await this.userService.update(req.param('id')!, req.all())
    return res.ok(data)
  }

  async destroy(req: DarkstarRequest, res: DarkstarResponse) {
    await this.userService.delete(req.param('id')!)
    return res.noContent()
  }
}
```

**`UserService.ts`**

```typescript
import { UserRepository } from '../repositories/UserRepository'

export class UserService {
  constructor(private userRepository: UserRepository) {}

  findAll()                                     { return this.userRepository.findAll() }
  findById(id: string)                          { return this.userRepository.findById(id) }
  create(data: Record<string, any>)             { return this.userRepository.create(data) }
  update(id: string, data: Record<string, any>) { return this.userRepository.update(id, data) }
  delete(id: string)                            { return this.userRepository.delete(id) }
}
```

**`UserRepository.ts`**

```typescript
import { User } from '../models/User'

export class UserRepository {
  findAll()                                     { return User.all() }
  findById(id: string)                          { return User.find(id) }
  create(data: Record<string, any>)             { return User.create(data) }
  update(id: string, data: Record<string, any>) { return User.where('id', id).update(data) }
  delete(id: string)                            { return User.where('id', id).delete() }
}
```

**`User.ts`**

```typescript
import { Model } from '@darkstar/orm'

export class User extends Model {
  static table = 'users'
}
```

**`UserSchema.ts`**

```typescript
export const UserSchema = {}
```

**`UserMiddleware.ts`**

```typescript
import { DarkstarRequest, DarkstarResponse, NextFunction } from '@darkstar/core'

export class UserMiddleware {
  handle(req: DarkstarRequest, res: DarkstarResponse, next: NextFunction) {
    next()
  }
}
```

---

## Utils — `make:util`

O comando `darkstar forge make:util User` gera utilitários prontos em `src/utils/user/`:

**`omitPassword.ts`**

```typescript
export function omitUserPassword<T extends Record<string, any>>(obj: T): Omit<T, 'password'> {
  const { password, ...rest } = obj
  return rest
}
```

**`twoFactor.ts`**

```typescript
import * as crypto from 'crypto'

export function generateUserTwoFactorCode(): string {
  const code = crypto.randomInt(100000, 999999)
  return code.toString()
}

export function validateUserTwoFactorCode(inputCode: string, expectedCode: string): boolean {
  return inputCode.trim() === expectedCode.trim()
}
```

---

## Security — `make:security`

O comando `darkstar forge make:security` gera o `src/middlewares/RateLimitMiddleware.ts` com 22 limiters prontos cobrindo:

- **Auth** — login, register, forgot/reset password, refresh token, verify email, two-factor
- **CRUD** — leitura, escrita, deleção
- **Arquivos** — upload, download
- **Tempo real** — SSE, WebSocket
- **Comunicação** — e-mail, SMS, webhook
- **Busca e relatórios** — search, stats, report
- **Admin** — geral e ações destrutivas
- **Pagamentos** — checkout, reembolso

Uso nas rotas:

```typescript
import { loginLimiter, registerLimiter, globalLimiter } from '../middlewares/RateLimitMiddleware'

router.post('/auth/login',    loginLimiter,    ...)
router.post('/auth/register', registerLimiter, ...)
router.use('/api',            globalLimiter)
```

---

## Rotas

Todas as rotas são prefixadas com `/api` por padrão. Exemplo com `make:api User`:

```
GET    /api/users
GET    /api/users/:id
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id
```

O prefixo pode ser alterado no boot da aplicação:

```typescript
await app.boot('/')    // sem prefixo
await app.boot('/v1')  // versionado
```

---

## ORM — Query Builder estilo Eloquent

```typescript
// buscar todos
const users = await User.all()

// buscar por id
const user = await User.find(1)

// filtros encadeados
const admins = await User
  .where('role', 'admin')
  .where('active', true)
  .orderBy('name')
  .get()

// criar
const user = await User.create({ name: 'Teste', email: 'Teste@email.com' })

// atualizar
await User.where('id', 1).update({ name: 'Teste' })

// deletar
await User.where('id', 1).delete()
```

---

## Limitações Conhecidas

O DarkStar está em **alpha inicial**. As limitações abaixo são conhecidas e serão resolvidas em versões futuras:

### ORM

- **Sem suporte a relacionamentos** — `hasOne`, `hasMany`, `belongsTo`, `belongsToMany` não estão implementados. Queries com JOIN precisam ser escritas em SQL raw por enquanto.
- **Schema builder é MySQL/MariaDB apenas** — `Schema.create()`, `hasTable()`, `addColumn()` e `dropColumn()` geram sintaxe MySQL. Migrations para PostgreSQL e SQLite precisam usar SQL raw na função `up()`.
- **Sem eager loading** — não existe equivalente ao `with()` do Laravel. Modelos relacionados precisam ser buscados em queries separadas.
- **`update()` retorna o número de linhas afetadas, não o registro atualizado** — `Model.update(id, data)` retorna `number`, não a instância atualizada. Busque o registro novamente após atualizar se precisar dos novos valores.
- **Sem API de transações** — não existe um helper `DB.transaction(callback)`. Transações precisam ser gerenciadas manualmente pelo driver raw.
- **SQLite não tem advisory locks** — `db:migrate` usa `GET_LOCK` (MySQL) e `pg_advisory_lock` (PostgreSQL) para evitar migrations concorrentes. SQLite não tem equivalente, então rodar migrations em paralelo no SQLite é inseguro.
- **`hasTable()` usa `SHOW TABLES`, que é MySQL apenas** — vai falhar no PostgreSQL e SQLite.

### Container IoC

- **Resolução de dependências é baseada no nome dos parâmetros do construtor** — o container analisa o código-fonte do construtor como string para inferir dependências. Isso quebra quando o código é minificado, bundled ou compilado de forma que renomeia parâmetros. Não use com bundlers que fazem mangling de variáveis (ex: esbuild com `minifyIdentifiers: true`).
- **Sem detecção de dependências circulares** — dependências circulares causarão stack overflow sem mensagem de erro útil.

### CLI

- **`darkstar new` usa caminhos `file:` locais** — o `package.json` gerado referencia `@darkstar/core` e `@darkstar/orm` como caminhos `file:` apontando para o monorepo. Isso será atualizado para versões npm na publicação.
- **`make:model` gera um stub com `createModel` que não existe no `@darkstar/orm`** — o comando `make:model` isolado gera `import { createModel, Model }`, que não é exportado pelo ORM. Use `make:api` ou copie o stub de model a partir dele.
- **`make:middleware` gera imports com `TanisRequest`/`TanisResponse`** — o comando `make:middleware` isolado ainda usa os aliases antigos `Tanis*`. Funcionam em runtime, mas são inconsistentes com a nomenclatura `Darkstar*` usada em todo o resto.
- **`darkstar serve` executa `npm run dev`** — assume que o projeto tem um script `dev` no `package.json`. Se você renomear, `darkstar serve` vai falhar.
- **O registro automático de seeders depende do comentário `// registre seus seeders aqui`** — se esse comentário for removido ou modificado no `DatabaseSeeder.ts`, o `make:seeder` não vai registrar o novo seeder automaticamente.

### Validação

- **`UserSchema` é um objeto vazio** — os schemas gerados por `make:schema` e `make:api` são stubs sem lógica de validação. Integre [Zod](https://zod.dev) ou [Joi](https://joi.dev) manualmente por enquanto.

### Autenticação em Dois Fatores

- **`twoFactor.ts` não é compatível com RFC 6238** — o util gerado usa `crypto.randomInt` para produzir um código único, mas não tem janela de tempo, HMAC nem segredo compartilhado. É adequado apenas como placeholder. Para 2FA em produção, use [`otplib`](https://github.com/yeojz/otplib).

---

## Inspirações

- **Laravel** — pela elegância e produtividade
- **Pandorum** — pela ideia de forjar algo novo no vácuo do espaço
- **Constellation CLI** — mesmo espírito de automatizar o que é repetitivo

---

> 🪐 DarkStar — Open Source