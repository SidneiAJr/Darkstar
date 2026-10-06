# CLI — DarkStar Forge

O CLI do DarkStar é instalado globalmente e expõe dois grupos de comandos: comandos de projeto (`new`, `serve`) e o subgrupo `forge`, que concentra toda a geração de arquivos e operações de banco de dados.

---

## Sumário

- [Instalação](#instalação)
- [Comandos de projeto](#comandos-de-projeto)
  - [new](#darkstar-new-nome)
  - [serve](#darkstar-serve)
- [Forge — Geradores](#forge--geradores)
  - [make:api](#darkstar-forge-makeapi-nome)
  - [make:controller](#darkstar-forge-makecontroller-nome)
  - [make:service](#darkstar-forge-makeservice-nome)
  - [make:repository](#darkstar-forge-makerepository-nome)
  - [make:model](#darkstar-forge-makemodel-nome)
  - [make:middleware](#darkstar-forge-makemiddleware-nome)
  - [make:schema](#darkstar-forge-makeschema-nome)
  - [make:migration](#darkstar-forge-makemigration-nome)
  - [make:seeder](#darkstar-forge-makeseeder-nome)
  - [make:util](#darkstar-forge-makeutil-nome)
  - [make:security](#darkstar-forge-makesecurity)
  - [make:deps](#darkstar-forge-makedeps-nomes)
- [Forge — Banco de dados](#forge--banco-de-dados)
  - [db:create](#darkstar-forge-dbcreate)
  - [db:migrate](#darkstar-forge-dbmigrate)
  - [db:rollback](#darkstar-forge-dbrollback)
  - [db:seed](#darkstar-forge-dbseed)
- [Fluxo recomendado do zero](#fluxo-recomendado-do-zero)
- [Regras de pluralização](#regras-de-pluralização)

---

## Instalação

```bash
npm install -g darkstar
```

---

## Comandos de projeto

### `darkstar new <nome>`

Cria um novo projeto DarkStar a partir do template oficial.

```bash
darkstar new meu-projeto
```

O que acontece internamente:

1. Copia a estrutura de pastas do template para `./meu-projeto/`
2. Configura o `.env` com `DB_DATABASE=meu-projeto`
3. Gera o `package.json` com as dependências do core já apontando para os pacotes locais
4. Roda `npm install` automaticamente

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

### `darkstar serve`

Sobe o servidor de desenvolvimento. Internamente executa `npm run dev`, que usa `tsx` para rodar `src/core/app.ts` diretamente sem compilar.

```bash
darkstar serve
```

---

## Forge — Geradores

Todos os geradores seguem as mesmas regras:

- O `<nome>` deve ser em **PascalCase** — `User`, `ProductCategory`, `OrderItem`
- Nenhum gerador sobrescreve arquivos existentes — se o arquivo já existe, o CLI exibe um erro e pula
- Os arquivos são criados em `src/` relativo ao diretório onde o comando é executado

---

### `darkstar forge make:api <nome>`

O comando mais usado. Gera toda a camada MVC de uma entidade em um único comando.

```bash
darkstar forge make:api User
```

Arquivos criados:

| Arquivo | Caminho |
|---|---|
| `UserController.ts` | `src/controllers/` |
| `UserService.ts` | `src/services/` |
| `UserRepository.ts` | `src/repositories/` |
| `User.ts` | `src/models/` |
| `users.ts` | `src/routes/` |
| `UserSchema.ts` | `src/schemas/` |
| `UserMiddleware.ts` | `src/middlewares/` |

Além dos arquivos, o comando registra automaticamente o import da rota em `src/core/app.ts`:

```typescript
import '../routes/users'
```

> O nome da rota e da tabela é pluralizado automaticamente. Veja as [regras de pluralização](#regras-de-pluralização).

O controller gerado já tem os cinco métodos REST prontos (`index`, `show`, `store`, `update`, `destroy`). O service delega para o repository, que delega para o model. A cadeia completa funciona desde o primeiro `darkstar serve`.

---

### `darkstar forge make:controller <nome>`

Gera apenas o controller.

```bash
darkstar forge make:controller User
```

Cria `src/controllers/UserController.ts` com os cinco métodos REST e o import do `UserService`.

---

### `darkstar forge make:service <nome>`

Gera apenas o service.

```bash
darkstar forge make:service User
```

Cria `src/services/UserService.ts` com os cinco métodos delegando para o `UserRepository`.

---

### `darkstar forge make:repository <nome>`

Gera apenas o repository.

```bash
darkstar forge make:repository User
```

Cria `src/repositories/UserRepository.ts` com os cinco métodos chamando os métodos estáticos do `User` model.

---

### `darkstar forge make:model <nome>`

Gera apenas o model.

```bash
darkstar forge make:model User
```

Cria `src/models/User.ts`:

```typescript
import { Model } from '@darkstar/orm'

export class User extends Model {
  static table = 'users'
}
```

O nome da tabela é inferido automaticamente via pluralização do nome em lowercase.

---

### `darkstar forge make:middleware <nome>`

Gera um middleware vazio.

```bash
darkstar forge make:middleware Auth
```

Cria `src/middlewares/AuthMiddleware.ts`:

```typescript
import { DarkstarRequest, DarkstarResponse, NextFunction } from '@darkstar/core'

export class AuthMiddleware {
  handle(req: DarkstarRequest, res: DarkstarResponse, next: NextFunction) {
    next()
  }
}
```

---

### `darkstar forge make:schema <nome>`

Gera um schema vazio para validação.

```bash
darkstar forge make:schema User
```

Cria `src/schemas/UserSchema.ts`:

```typescript
export const UserSchema = {}
```

O schema é gerado vazio intencionalmente — a lib de validação (Zod, Yup, Joi) fica a critério do projeto. Use `make:deps` para instalar a que preferir.

---

### `darkstar forge make:migration <nome>`

Gera uma migration com timestamp no nome.

```bash
darkstar forge make:migration CreateUsersTable
```

Cria `database/migrations/2026_10_06_12_00_00_CreateUsersTable.ts`:

```typescript
import type { BaseDriver } from '@darkstar/orm'
import { Schema, Blueprint } from '@darkstar/orm'

export async function up(driver: BaseDriver): Promise<void> {
  const schema = new Schema(driver)

  await schema.create('users', (table: Blueprint) => {
    table.id()
    table.timestamps()
  })
}

export async function down(driver: BaseDriver): Promise<void> {
  const schema = new Schema(driver)
  await schema.drop('users')
}
```

O nome da tabela é extraído do nome da migration:

- `CreateUsersTable` → `users`
- `CreateProductCategoriesTable` → `product_categories`
- Qualquer outro formato → pluralização do nome em lowercase

Depois de gerar, edite o arquivo e adicione as colunas da sua tabela antes de rodar `db:migrate`.

---

### `darkstar forge make:seeder <nome>`

Gera um seeder e o registra automaticamente no `DatabaseSeeder.ts`.

```bash
darkstar forge make:seeder User
```

O seeder gerado lê os campos da migration correspondente automaticamente. Se existir `CreateUsersTable` em `database/migrations/`, o CLI extrai as colunas e gera valores fake apropriados por nome e tipo:

| Coluna | Valor gerado |
|---|---|
| `password` | `await bcrypt.hash('password', 10)` |
| `email` | `` `user${i}@darkstar.dev` `` |
| `name` | `` `User ${i}` `` |
| `role` | `i === 1 ? 'admin' : 'user'` |
| `*_id` | `i` |
| `integer` / `decimal` | `i` |
| `boolean` | `true` |
| `date` / `timestamp` | `new Date()` |
| outros | `` `coluna_${i}` `` |

Se a migration tiver o campo `password`, o seeder importa `bcrypt` automaticamente.

O seeder é registrado em `DatabaseSeeder.ts` — você não precisa fazer isso manualmente.

> Se a migration não for encontrada, o seeder é gerado com um bloco de campos vazio e um comentário para preencher manualmente.

---

### `darkstar forge make:util <nome>`

Gera dois utilitários prontos em `src/utils/<nome>/`.

```bash
darkstar forge make:util User
```

**`omitPassword.ts`** — remove o campo `password` de um objeto preservando a tipagem:

```typescript
export function omitUserPassword<T extends Record<string, any>>(obj: T): Omit<T, 'password'> {
  const { password, ...rest } = obj
  return rest
}
```

**`twoFactor.ts`** — gera e valida códigos de 6 dígitos:

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

> O `twoFactor.ts` usa `crypto.randomInt` nativo do Node. Para TOTP compatível com Google Authenticator (RFC 6238), o próprio arquivo documenta o uso da lib `otplib`.

---

### `darkstar forge make:security`

Gera `src/middlewares/RateLimitMiddleware.ts` com 22 limiters prontos cobrindo os cenários mais comuns.

```bash
darkstar forge make:security
```

Requer a instalação de `express-rate-limit`:

```bash
npm install express-rate-limit
```

Limiters gerados por categoria:

| Categoria | Limiters |
|---|---|
| Auth | `loginLimiter`, `registerLimiter`, `forgotPasswordLimiter`, `resetPasswordLimiter`, `refreshTokenLimiter`, `verifyEmailLimiter`, `twoFactorLimiter` |
| API geral | `globalLimiter`, `readLimiter`, `writeLimiter`, `deleteLimiter` |
| Arquivos | `uploadLimiter`, `downloadLimiter` |
| Tempo real | `sseLimiter`, `websocketLimiter` |
| Comunicação | `emailLimiter`, `smsLimiter`, `webhookLimiter` |
| Busca e relatórios | `searchLimiter`, `statsLimiter`, `reportLimiter` |
| Admin | `adminLimiter`, `adminDestructiveLimiter` |
| Pagamentos | `paymentLimiter`, `refundLimiter` |

Uso nas rotas:

```typescript
import { loginLimiter, globalLimiter } from '../middlewares/RateLimitMiddleware'

router.post('/auth/login', loginLimiter, ...)
router.use('/api', globalLimiter)
```

---

### `darkstar forge make:deps [nomes...]`

Instala dependências opcionais com tipos já incluídos quando necessário. Sem argumentos, lista todas as dependências disponíveis.

```bash
# listar tudo disponível
darkstar forge make:deps

# instalar dependências específicas
darkstar forge make:deps bcrypt jwt zod
darkstar forge make:deps winston multer redis
```

Dependências disponíveis por categoria:

| Categoria | Chave | O que instala |
|---|---|---|
| Autenticação | `jwt` | `jsonwebtoken` + `@types/jsonwebtoken` |
| Autenticação | `bcrypt` | `bcrypt` + `@types/bcrypt` |
| Autenticação | `otplib` | `otplib` |
| Autenticação | `passport` | `passport`, `passport-local`, `passport-jwt` + types |
| Validação | `zod` | `zod` |
| Validação | `yup` | `yup` |
| Validação | `joi` | `joi` |
| Validação | `class-validator` | `class-validator`, `class-transformer` |
| Upload | `multer` | `multer` + `@types/multer` |
| Upload | `sharp` | `sharp` |
| Upload | `pdf-lib` | `pdf-lib` |
| Email | `nodemailer` | `nodemailer` + `@types/nodemailer` |
| Email | `resend` | `resend` |
| HTTP | `cors` | `cors` + `@types/cors` |
| HTTP | `axios` | `axios` |
| HTTP | `helmet` | `helmet` |
| HTTP | `rate-limiter` | `express-rate-limit` |
| Logs | `winston` | `winston` |
| Logs | `pino` | `pino`, `pino-pretty` |
| Logs | `morgan` | `morgan` + `@types/morgan` |
| Banco | `redis` | `ioredis` + `@types/ioredis` |
| Banco | `mongoose` | `mongoose` |
| Banco | `prisma` | `prisma`, `@prisma/client` |
| Utilitários | `uuid` | `uuid` + `@types/uuid` |
| Utilitários | `dayjs` | `dayjs` |
| Utilitários | `lodash` | `lodash` + `@types/lodash` |
| Utilitários | `dotenv` | `dotenv` |

---

## Forge — Banco de dados

### `darkstar forge db:create`

Cria o banco de dados definido em `DB_DATABASE` no `.env`. Suporta MySQL, MariaDB e PostgreSQL. Para SQLite não faz nada — o arquivo é criado automaticamente pelo driver.

```bash
darkstar forge db:create
```

Para PostgreSQL, o comando conecta no banco `postgres` padrão e verifica se o banco já existe antes de criar — seguro rodar mais de uma vez.

---

### `darkstar forge db:migrate`

Roda todas as migrations pendentes em ordem crescente de timestamp.

```bash
darkstar forge db:migrate
```

Como funciona:

1. Conecta ao banco e cria a tabela `darkstar_migrations` se não existir
2. Consulta quais migrations já foram executadas
3. Roda apenas as pendentes, em ordem de nome (timestamp garante a ordem)
4. Cada migration roda dentro de uma transaction — em caso de falha, faz rollback e interrompe
5. Registra o nome do arquivo em `darkstar_migrations` após cada execução bem-sucedida

O comando usa advisory locks (`GET_LOCK` no MySQL, `pg_advisory_lock` no PostgreSQL) para evitar que duas instâncias rodem migrations simultaneamente.

> Se uma migration falhar, o processo encerra com código de saída 1. Corrija o erro e rode `db:migrate` novamente — as migrations já executadas são puladas.

---

### `darkstar forge db:rollback`

Desfaz a última migration executada.

```bash
darkstar forge db:rollback
```

Pega o registro mais recente de `darkstar_migrations`, carrega o arquivo correspondente, chama `down()` e remove o registro da tabela de controle. Desfaz uma migration por vez.

---

### `darkstar forge db:seed`

Popula o banco executando o `DatabaseSeeder`.

```bash
darkstar forge db:seed
```

Carrega `database/seeders/DatabaseSeeder.ts` e chama `run()`. O `DatabaseSeeder` instancia todos os seeders registrados em sequência. Seeders criados com `make:seeder` são registrados automaticamente nesse arquivo.

---

## Fluxo recomendado do zero

```bash
# 1. Criar o projeto
darkstar new meu-projeto
cd meu-projeto

# 2. Criar o banco
darkstar forge db:create

# 3. Gerar a migration
darkstar forge make:migration CreateUsersTable
# edite database/migrations/*_CreateUsersTable.ts com as colunas

# 4. Rodar a migration
darkstar forge db:migrate

# 5. Gerar a API completa
darkstar forge make:api User

# 6. Gerar o seeder (lê os campos da migration automaticamente)
darkstar forge make:seeder User

# 7. Popular o banco
darkstar forge db:seed

# 8. Gerar utilitários
darkstar forge make:util User

# 9. Gerar rate limiters
darkstar forge make:security

# 10. Subir o servidor
darkstar serve
```

---

## Regras de pluralização

O CLI pluraliza nomes automaticamente para gerar nomes de tabelas e rotas. As regras seguem o inglês:

| Terminação | Regra | Exemplo |
|---|---|---|
| `-ch`, `-sh`, `-x`, `-z`, `-s` | `+es` | `watch` → `watches` |
| consoante `+y` | `-y` `+ies` | `category` → `categories` |
| vogal `+y` (`-ay`, `-ey`, `-oy`, `-uy`) | `+s` | `day` → `days` |
| qualquer outro | `+s` | `user` → `users` |

> Nomes em português podem não pluralizar corretamente. Se precisar de um nome de tabela diferente do gerado, defina manualmente no model após a geração: `static table = 'minha_tabela'`.