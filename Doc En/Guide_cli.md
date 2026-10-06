# CLI — DarkStar Forge

The DarkStar CLI is installed globally and exposes two groups of commands: project commands (`new`, `serve`) and the `forge` subgroup, which handles all file generation and database operations.

---

## Table of Contents

- [Installation](#installation)
- [Project Commands](#project-commands)
  - [new](#darkstar-new-name)
  - [serve](#darkstar-serve)
- [Forge — Generators](#forge--generators)
  - [make:api](#darkstar-forge-makeapi-name)
  - [make:controller](#darkstar-forge-makecontroller-name)
  - [make:service](#darkstar-forge-makeservice-name)
  - [make:repository](#darkstar-forge-makerepository-name)
  - [make:model](#darkstar-forge-makemodel-name)
  - [make:middleware](#darkstar-forge-makemiddleware-name)
  - [make:schema](#darkstar-forge-makeschema-name)
  - [make:migration](#darkstar-forge-makemigration-name)
  - [make:seeder](#darkstar-forge-makeseeder-name)
  - [make:util](#darkstar-forge-makeutil-name)
  - [make:security](#darkstar-forge-makesecurity)
  - [make:deps](#darkstar-forge-makedeps-names)
- [Forge — Database](#forge--database)
  - [db:create](#darkstar-forge-dbcreate)
  - [db:migrate](#darkstar-forge-dbmigrate)
  - [db:rollback](#darkstar-forge-dbrollback)
  - [db:seed](#darkstar-forge-dbseed)
- [Recommended flow from scratch](#recommended-flow-from-scratch)
- [Pluralization rules](#pluralization-rules)

---

## Installation

```bash
npm install -g darkstar
```

---

## Project Commands

### `darkstar new <name>`

Creates a new DarkStar project from the official template.

```bash
darkstar new my-project
```

What happens internally:

1. Copies the folder structure from the template into `./my-project/`
2. Configures `.env` with `DB_DATABASE=my-project`
3. Generates `package.json` with core dependencies already pointing to local packages
4. Runs `npm install` automatically

Generated structure:

```
my-project/
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

Starts the development server. Internally runs `npm run dev`, which uses `tsx` to run `src/core/app.ts` directly without compiling.

```bash
darkstar serve
```

---

## Forge — Generators

All generators follow the same rules:

- `<name>` must be in **PascalCase** — `User`, `ProductCategory`, `OrderItem`
- No generator overwrites existing files — if the file already exists, the CLI displays an error and skips it
- Files are created under `src/` relative to the directory where the command is run

---

### `darkstar forge make:api <name>`

The most-used command. Generates the full MVC layer for an entity in a single command.

```bash
darkstar forge make:api User
```

Files created:

| File | Path |
|---|---|
| `UserController.ts` | `src/controllers/` |
| `UserService.ts` | `src/services/` |
| `UserRepository.ts` | `src/repositories/` |
| `User.ts` | `src/models/` |
| `users.ts` | `src/routes/` |
| `UserSchema.ts` | `src/schemas/` |
| `UserMiddleware.ts` | `src/middlewares/` |

In addition to the files, the command automatically registers the route import in `src/core/app.ts`:

```typescript
import '../routes/users'
```

> The route name and table name are pluralized automatically. See [pluralization rules](#pluralization-rules).

The generated controller already has all five REST methods ready (`index`, `show`, `store`, `update`, `destroy`). The service delegates to the repository, which delegates to the model. The full chain works from the very first `darkstar serve`.

---

### `darkstar forge make:controller <name>`

Generates only the controller.

```bash
darkstar forge make:controller User
```

Creates `src/controllers/UserController.ts` with the five REST methods and the `UserService` import.

---

### `darkstar forge make:service <name>`

Generates only the service.

```bash
darkstar forge make:service User
```

Creates `src/services/UserService.ts` with the five methods delegating to `UserRepository`.

---

### `darkstar forge make:repository <name>`

Generates only the repository.

```bash
darkstar forge make:repository User
```

Creates `src/repositories/UserRepository.ts` with the five methods calling the static methods of the `User` model.

---

### `darkstar forge make:model <name>`

Generates only the model.

```bash
darkstar forge make:model User
```

Creates `src/models/User.ts`:

```typescript
import { Model } from '@darkstar/orm'

export class User extends Model {
  static table = 'users'
}
```

The table name is inferred automatically by pluralizing the lowercase name.

---

### `darkstar forge make:middleware <name>`

Generates an empty middleware.

```bash
darkstar forge make:middleware Auth
```

Creates `src/middlewares/AuthMiddleware.ts`:

```typescript
import { DarkstarRequest, DarkstarResponse, NextFunction } from '@darkstar/core'

export class AuthMiddleware {
  handle(req: DarkstarRequest, res: DarkstarResponse, next: NextFunction) {
    next()
  }
}
```

---

### `darkstar forge make:schema <name>`

Generates an empty schema for validation.

```bash
darkstar forge make:schema User
```

Creates `src/schemas/UserSchema.ts`:

```typescript
export const UserSchema = {}
```

The schema is intentionally generated empty — the validation library (Zod, Yup, Joi) is up to each project. Use `make:deps` to install whichever you prefer.

---

### `darkstar forge make:migration <name>`

Generates a migration with a timestamp in the filename.

```bash
darkstar forge make:migration CreateUsersTable
```

Creates `database/migrations/2026_10_06_12_00_00_CreateUsersTable.ts`:

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

The table name is extracted from the migration name:

- `CreateUsersTable` → `users`
- `CreateProductCategoriesTable` → `product_categories`
- Any other format → pluralized lowercase name

After generating, edit the file and add your table columns before running `db:migrate`.

---

### `darkstar forge make:seeder <name>`

Generates a seeder and automatically registers it in `DatabaseSeeder.ts`.

```bash
darkstar forge make:seeder User
```

The generated seeder reads the fields from the corresponding migration automatically. If `CreateUsersTable` exists in `database/migrations/`, the CLI extracts its columns and generates appropriate fake values by name and type:

| Column | Generated value |
|---|---|
| `password` | `await bcrypt.hash('password', 10)` |
| `email` | `` `user${i}@darkstar.dev` `` |
| `name` | `` `User ${i}` `` |
| `role` | `i === 1 ? 'admin' : 'user'` |
| `*_id` | `i` |
| `integer` / `decimal` | `i` |
| `boolean` | `true` |
| `date` / `timestamp` | `new Date()` |
| others | `` `column_${i}` `` |

If the migration has a `password` field, the seeder automatically imports `bcrypt`.

The seeder is registered in `DatabaseSeeder.ts` — you don't need to do this manually.

> If the migration is not found, the seeder is generated with an empty fields block and a comment to fill in manually.

---

### `darkstar forge make:util <name>`

Generates two ready-to-use utilities in `src/utils/<name>/`.

```bash
darkstar forge make:util User
```

**`omitPassword.ts`** — removes the `password` field from an object while preserving typing:

```typescript
export function omitUserPassword<T extends Record<string, any>>(obj: T): Omit<T, 'password'> {
  const { password, ...rest } = obj
  return rest
}
```

**`twoFactor.ts`** — generates and validates 6-digit codes:

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

> `twoFactor.ts` uses Node's native `crypto.randomInt`. For TOTP compatible with Google Authenticator (RFC 6238), the file itself documents the use of the `otplib` library.

---

### `darkstar forge make:security`

Generates `src/middlewares/RateLimitMiddleware.ts` with 22 ready-made limiters covering the most common scenarios.

```bash
darkstar forge make:security
```

Requires installing `express-rate-limit`:

```bash
npm install express-rate-limit
```

Generated limiters by category:

| Category | Limiters |
|---|---|
| Auth | `loginLimiter`, `registerLimiter`, `forgotPasswordLimiter`, `resetPasswordLimiter`, `refreshTokenLimiter`, `verifyEmailLimiter`, `twoFactorLimiter` |
| General API | `globalLimiter`, `readLimiter`, `writeLimiter`, `deleteLimiter` |
| Files | `uploadLimiter`, `downloadLimiter` |
| Real-time | `sseLimiter`, `websocketLimiter` |
| Communication | `emailLimiter`, `smsLimiter`, `webhookLimiter` |
| Search & Reports | `searchLimiter`, `statsLimiter`, `reportLimiter` |
| Admin | `adminLimiter`, `adminDestructiveLimiter` |
| Payments | `paymentLimiter`, `refundLimiter` |

Usage in routes:

```typescript
import { loginLimiter, globalLimiter } from '../middlewares/RateLimitMiddleware'

router.post('/auth/login', loginLimiter, ...)
router.use('/api', globalLimiter)
```

---

### `darkstar forge make:deps [names...]`

Installs optional dependencies with types already included when necessary. Without arguments, lists all available dependencies.

```bash
# list everything available
darkstar forge make:deps

# install specific dependencies
darkstar forge make:deps bcrypt jwt zod
darkstar forge make:deps winston multer redis
```

Available dependencies by category:

| Category | Key | What it installs |
|---|---|---|
| Auth | `jwt` | `jsonwebtoken` + `@types/jsonwebtoken` |
| Auth | `bcrypt` | `bcrypt` + `@types/bcrypt` |
| Auth | `otplib` | `otplib` |
| Auth | `passport` | `passport`, `passport-local`, `passport-jwt` + types |
| Validation | `zod` | `zod` |
| Validation | `yup` | `yup` |
| Validation | `joi` | `joi` |
| Validation | `class-validator` | `class-validator`, `class-transformer` |
| Upload | `multer` | `multer` + `@types/multer` |
| Upload | `sharp` | `sharp` |
| Upload | `pdf-lib` | `pdf-lib` |
| Email | `nodemailer` | `nodemailer` + `@types/nodemailer` |
| Email | `resend` | `resend` |
| HTTP | `cors` | `cors` + `@types/cors` |
| HTTP | `axios` | `axios` |
| HTTP | `helmet` | `helmet` |
| HTTP | `rate-limiter` | `express-rate-limit` |
| Logging | `winston` | `winston` |
| Logging | `pino` | `pino`, `pino-pretty` |
| Logging | `morgan` | `morgan` + `@types/morgan` |
| Database | `redis` | `ioredis` + `@types/ioredis` |
| Database | `mongoose` | `mongoose` |
| Database | `prisma` | `prisma`, `@prisma/client` |
| Utilities | `uuid` | `uuid` + `@types/uuid` |
| Utilities | `dayjs` | `dayjs` |
| Utilities | `lodash` | `lodash` + `@types/lodash` |
| Utilities | `dotenv` | `dotenv` |

---

## Forge — Database

### `darkstar forge db:create`

Creates the database defined in `DB_DATABASE` in `.env`. Supports MySQL, MariaDB, and PostgreSQL. For SQLite, does nothing — the file is created automatically by the driver.

```bash
darkstar forge db:create
```

For PostgreSQL, the command connects to the default `postgres` database and checks whether the database already exists before creating it — safe to run more than once.

---

### `darkstar forge db:migrate`

Runs all pending migrations in ascending timestamp order.

```bash
darkstar forge db:migrate
```

How it works:

1. Connects to the database and creates the `darkstar_migrations` table if it doesn't exist
2. Queries which migrations have already been executed
3. Runs only the pending ones, in name order (timestamp ensures order)
4. Each migration runs inside a transaction — on failure, rolls back and halts
5. Records the filename in `darkstar_migrations` after each successful run

The command uses advisory locks (`GET_LOCK` on MySQL, `pg_advisory_lock` on PostgreSQL) to prevent two instances from running migrations simultaneously.

> If a migration fails, the process exits with code 1. Fix the error and run `db:migrate` again — already executed migrations are skipped.

---

### `darkstar forge db:rollback`

Undoes the last executed migration.

```bash
darkstar forge db:rollback
```

Fetches the most recent record from `darkstar_migrations`, loads the corresponding file, calls `down()`, and removes the record from the control table. Undoes one migration at a time.

---

### `darkstar forge db:seed`

Populates the database by running the `DatabaseSeeder`.

```bash
darkstar forge db:seed
```

Loads `database/seeders/DatabaseSeeder.ts` and calls `run()`. The `DatabaseSeeder` instantiates all registered seeders in sequence. Seeders created with `make:seeder` are automatically registered in this file.

---

## Recommended flow from scratch

```bash
# 1. Create the project
darkstar new my-project
cd my-project

# 2. Create the database
darkstar forge db:create

# 3. Generate the migration
darkstar forge make:migration CreateUsersTable
# edit database/migrations/*_CreateUsersTable.ts with your columns

# 4. Run the migration
darkstar forge db:migrate

# 5. Generate the full API
darkstar forge make:api User

# 6. Generate the seeder (reads fields from the migration automatically)
darkstar forge make:seeder User

# 7. Seed the database
darkstar forge db:seed

# 8. Generate utilities
darkstar forge make:util User

# 9. Generate rate limiters
darkstar forge make:security

# 10. Start the server
darkstar serve
```

---

## Pluralization rules

The CLI pluralizes names automatically to generate table names and routes. The rules follow English:

| Ending | Rule | Example |
|---|---|---|
| `-ch`, `-sh`, `-x`, `-z`, `-s` | `+es` | `watch` → `watches` |
| consonant `+y` | `-y` `+ies` | `category` → `categories` |
| vowel `+y` (`-ay`, `-ey`, `-oy`, `-uy`) | `+s` | `day` → `days` |
| anything else | `+s` | `user` → `users` |

> Names in other languages may not pluralize correctly. If you need a table name different from the one generated, define it manually in the model after generation: `static table = 'my_table'`