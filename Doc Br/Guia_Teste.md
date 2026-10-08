# 🧪 Testes do DarkStar — O que foi testado e por quê

> **175 testes · 13 arquivos · 100% passando**  
> Framework: [Vitest](https://vitest.dev/) — rápido, nativo TypeScript, zero configuração extra.

---

## Por que testar um framework?

Num framework, um bug não quebra um projeto — quebra **todos os projetos** que usam ele.

Se o `QueryBuilder` gerar um SQL errado, toda query de toda aplicação feita com DarkStar vai falhar. Se o `make:api` criar os arquivos com imports errados, o desenvolvedor vai passar horas depurando algo que deveria funcionar do zero.

Testes garantem que o núcleo do framework é confiável antes de qualquer coisa ser construída em cima dele.

---

## 📁 Estrutura dos testes

```
darkstar/
└── tests/
    ├── app.test.ts              #  4 testes — Boot da aplicação, error handler, not found
    ├── blueprint.test.ts        # 21 testes — Definição de colunas
    ├── cli.test.ts              # 12 testes — Comandos CLI (controller, migration, seeder)
    ├── container.test.ts        #  7 testes — IoC Container
    ├── db-commands.test.ts      #  4 testes — db:migrate, db:rollback, db:seed
    ├── make-api.test.ts         # 14 testes — Geração de API completa
    ├── make-extras.test.ts      # 14 testes — make:model, service, middleware, repository, schema, util
    ├── model.test.ts            # 13 testes — Model base e QueryBuilder integrado
    ├── query-builder.test.ts    # 23 testes — ORM / QueryBuilder
    ├── request.test.ts          # 24 testes — HTTP Request wrapper
    ├── response.test.ts         # 16 testes — HTTP Response wrapper
    ├── router.test.ts           # 11 testes — Roteador HTTP
    └── schema.test.ts           # 12 testes — Schema / Migrations DDL
```

---

## ✅ Testes implementados

### 1. `app.test.ts` — 4 testes

Boot e middlewares da aplicação principal.

- `getApp()` retorna instância válida do Express
- `boot()` conecta ao banco e retorna a própria instância (encadeamento)
- Error handler responde 500 com a mensagem do erro
- Not found responde 404 com "Rota não encontrada"

---

### 2. `blueprint.test.ts` — 21 testes

O `Blueprint` define como uma tabela deve ser criada nas migrations.

**Tipos de coluna testados:**

| Método | Tipo esperado |
|---|---|
| `id()` | `BIGINT UNSIGNED AUTO_INCREMENT PRIMARY` |
| `uuid('id')` | `VARCHAR(36) PRIMARY UNIQUE` |
| `string('name')` | `VARCHAR(255)` |
| `string('token', 64)` | `VARCHAR(64)` |
| `integer('age')` | `INT` |
| `bigInteger('views')` | `BIGINT` |
| `decimal('price', 10, 4)` | `DECIMAL(10,4)` |
| `boolean('active')` | `TINYINT(1)` |
| `text('bio')` | `TEXT` |
| `longText('content')` | `LONGTEXT` |
| `json('metadata')` | `JSON` |
| `date('birthday')` | `DATE` |
| `dateTime('scheduled_at')` | `DATETIME` |
| `timestamp('confirmed_at')` | `TIMESTAMP` |

**Modificadores:** `.nullable()`, `.unique()`, `.default(value)`

**Atalhos especiais:** `timestamps()`, `softDeletes()`, `foreignId().references().on()`

---

### 3. `cli.test.ts` — 12 testes

Testa os comandos de geração via CLI com filesystem real em diretório temporário.

- **makeController** — cria o arquivo, contém a classe e import do Service, não sobrescreve existente
- **makeMigration** — cria com timestamp no nome, exporta `up()` e `down()`, extrai nome da tabela de `create_X_table`, cria a pasta se não existir
- **makeSeeder** — cria o arquivo, contém classe e import do Model, stub especial para `User` com bcrypt, registra no `DatabaseSeeder.ts`, não duplica registro

---

### 4. `container.test.ts` — 7 testes

O `TanisContainer` é o IoC container estilo Laravel — resolve dependências automaticamente pelo nome dos parâmetros do construtor.

- `bind` + `make` sem dependências
- Resolução automática de dependências pelo nome do parâmetro
- Cadeia de dependências: `Controller → Service → Repository`
- `make()` aceita a classe diretamente (sem string)
- `make()` cria nova instância a cada chamada (sem singleton por padrão)
- `singleton()` retorna sempre a mesma instância
- `singleton()` resolve dependências na criação

---

### 5. `db-commands.test.ts` — 4 testes

Testa os comandos de banco de dados com driver mockado e filesystem temporário.

- **db:migrate** — roda migrations em ordem crescente de timestamp
- **db:migrate** — não roda migration que já foi executada
- **db:rollback** — executa o `down()` da última migration rodada
- **db:seed** — executa o `DatabaseSeeder` e chama `run()`

---

### 6. `make-api.test.ts` — 14 testes

O `make:api` gera 7 arquivos de uma vez para uma entidade completa.

**pluralize() — 8 testes:**

| Entrada | Saída | Regra |
|---|---|---|
| `user` | `users` | padrão: +s |
| `watch` | `watches` | `-ch` → +es |
| `wish` | `wishes` | `-sh` → +es |
| `box` | `boxes` | `-x` → +es |
| `category` | `categories` | consoante+y → -ies |
| `day` | `days` | vogal+y → +s |

**makeApi() — 6 testes:** cria os 7 arquivos, controller importa o service correto, repository usa o model correto, model usa tabela pluralizada, não sobrescreve existente, registra rota no `app.ts`.

---

### 7. `make-extras.test.ts` — 14 testes

Testa os comandos de geração individuais com filesystem temporário.

- **makeModel** — cria o arquivo, extende `Model`, define `static table`, importa a base, não sobrescreve existente
- **makeService** — cria o arquivo, contém a classe e importa o Repository, não sobrescreve existente
- **makeMiddleware** — cria o arquivo, contém `req`, `res`, `next`, não sobrescreve existente
- **makeRepository** — cria o arquivo, importa o Model correto
- **makeSchema** — cria o arquivo do schema
- **makeUtil** — cria os arquivos `omitPassword.ts` e `twoFactor.ts`

---

### 8. `model.test.ts` — 13 testes

Model base integrado ao QueryBuilder.

- `all()`, `find(id)`, `create(data)`, `update()`, `delete()`
- `where()` encadeado no Model
- `count()`, `exists()`
- `paginate(page, perPage)`
- Soft deletes — `deleted_at` preenchido no delete, ignorado no select

---

### 9. `query-builder.test.ts` — 23 testes

O coração do ORM — transforma chamadas TypeScript em SQL.

**toSql() — 12 testes:**

| Chamada | SQL gerado |
|---|---|
| vazio | `SELECT * FROM users` |
| `.where('role', 'admin')` | `WHERE role = "admin"` |
| `.where('age', '>', 18)` | `WHERE age > 18` |
| `.where().where()` | `WHERE ... AND ...` |
| `.whereIn('id', [1,2,3])` | `WHERE id IN (1, 2, 3)` |
| `.whereNotIn('id', [4,5])` | `WHERE id NOT IN (4, 5)` |
| `.whereLike('name', '%teste%')` | `WHERE name LIKE "%teste%"` |
| `.orderBy('name')` | `ORDER BY name ASC` |
| `.orderBy('created_at', 'desc')` | `ORDER BY created_at DESC` |
| `.limit(10).offset(20)` | `LIMIT 10 OFFSET 20` |
| `.select('id', 'name')` | `SELECT id, name FROM users` |
| Pipeline completo | Todos combinados corretamente |

**Execução — 11 testes:** `get()`, `first()`, `all()`, `find(id)`, `count()`, `exists()`, `delete()`, `paginate(page, perPage)`

---

### 10. `request.test.ts` — 24 testes

Wrapper do `Request` do Express com API mais ergonômica.

- **Body:** `input()`, `only()`, `except()`, `all()`, `has()`
- **Params/Query:** `param()`, `query()` com fallback e array
- **Headers:** `header()` case-insensitive, `bearerToken()`
- **Checagens:** `method()`, `path()`, `url()`, `ip()`, `raw()`

---

### 11. `response.test.ts` — 16 testes

Wrapper do `Response` do Express com métodos semânticos.

- **Sucesso:** `ok()` 200, `created()` 201, `noContent()` 204, `json()`
- **Erros:** `badRequest()` 400, `unauthorized()` 401, `forbidden()` 403, `notFound()` 404, `unprocessable()` 422, `serverError()` 500
- **Headers:** `status()` com encadeamento, `setHeader()`, `raw()`

---

### 12. `router.test.ts` — 11 testes

Roteador HTTP com suporte a resource routes.

- Registro de `get()`, `post()`, `put()`, `patch()`, `delete()`
- `resource()` registra as 5 rotas REST — **só registra as rotas cujos métodos existem no controller**
- `list()` inclui o nome do controller
- Múltiplos resources acumulam rotas corretamente
- Encadeamento retorna o próprio router
- `build()` retorna Express Router com as rotas na stack

---

### 13. `schema.test.ts` — 12 testes

Executa o DDL real via driver mockado.

- `create()`: `CREATE TABLE IF NOT EXISTS`, `UNIQUE KEY`, nullable, `FOREIGN KEY`, `DEFAULT` string e numérico, `softDeletes`
- `drop()`: `DROP TABLE IF EXISTS`
- `hasTable()`: retorna `true`/`false` pelo resultado da query
- `addColumn()`: `ALTER TABLE ADD COLUMN`
- `dropColumn()`: `ALTER TABLE DROP COLUMN`

---

## Resultado atual

```
 ✓ darkstar/tests/app.test.ts               ( 4)
 ✓ darkstar/tests/blueprint.test.ts         (21)
 ✓ darkstar/tests/cli.test.ts               (12)
 ✓ darkstar/tests/container.test.ts          (7)
 ✓ darkstar/tests/db-commands.test.ts        (4)
 ✓ darkstar/tests/make-api.test.ts          (14)
 ✓ darkstar/tests/make-extras.test.ts       (14)
 ✓ darkstar/tests/model.test.ts             (13)
 ✓ darkstar/tests/query-builder.test.ts     (23)
 ✓ darkstar/tests/request.test.ts           (24)
 ✓ darkstar/tests/response.test.ts          (16)
 ✓ darkstar/tests/router.test.ts            (11)
 ✓ darkstar/tests/schema.test.ts            (12)

 Test Files  13 passed (13)
      Tests  175 passed (175)
   Duration  ~1.49s
```

---

## Como rodar

```bash
# rodar uma vez
npm test

# modo watch (roda a cada alteração)
npm run test:watch

# com cobertura de código
npm run test:coverage
```

---

> 🪐 DarkStar — Open Source