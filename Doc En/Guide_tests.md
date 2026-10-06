# 🧪 DarkStar Tests — What was tested and why

> **175 tests · 13 files · 100% passing**  
> Framework: [Vitest](https://vitest.dev/) — fast, native TypeScript, zero extra configuration.

---

## Why test a framework?

In a framework, a bug doesn't break one project — it breaks **every project** that uses it.

If the `QueryBuilder` generates wrong SQL, every query in every application built with DarkStar will fail. If `make:api` creates files with wrong imports, the developer will spend hours debugging something that should have worked from day one.

Tests ensure the framework core is reliable before anything is built on top of it.

---

## 📁 Test structure

```
darkstar/
└── tests/
    ├── app.test.ts              #  4 tests — Application boot, error handler, not found
    ├── blueprint.test.ts        # 21 tests — Column definitions
    ├── cli.test.ts              # 12 tests — CLI commands (controller, migration, seeder)
    ├── container.test.ts        #  7 tests — IoC Container
    ├── db-commands.test.ts      #  4 tests — db:migrate, db:rollback, db:seed
    ├── make-api.test.ts         # 14 tests — Full API generation
    ├── make-extras.test.ts      # 14 tests — make:model, service, middleware, repository, schema, util
    ├── model.test.ts            # 13 tests — Base model and integrated QueryBuilder
    ├── query-builder.test.ts    # 23 tests — ORM / QueryBuilder
    ├── request.test.ts          # 24 tests — HTTP Request wrapper
    ├── response.test.ts         # 16 tests — HTTP Response wrapper
    ├── router.test.ts           # 11 tests — HTTP Router
    └── schema.test.ts           # 12 tests — Schema / Migrations DDL
```

---

## ✅ Implemented tests

### 1. `app.test.ts` — 4 tests

Boot and middleware of the main application.

- `getApp()` returns a valid Express instance
- `boot()` connects to the database and returns the instance itself (chaining)
- Error handler responds 500 with the error message
- Not found responds 404 with "Route not found"

---

### 2. `blueprint.test.ts` — 21 tests

`Blueprint` defines how a table should be created in migrations.

**Column types tested:**

| Method | Expected type |
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

**Modifiers:** `.nullable()`, `.unique()`, `.default(value)`

**Special shortcuts:** `timestamps()`, `softDeletes()`, `foreignId().references().on()`

---

### 3. `cli.test.ts` — 12 tests

Tests CLI generation commands with a real filesystem in a temporary directory.

- **makeController** — creates the file, contains the class and Service import, does not overwrite existing
- **makeMigration** — creates with timestamp in name, exports `up()` and `down()`, extracts table name from `create_X_table`, creates the folder if it doesn't exist
- **makeSeeder** — creates the file, contains class and Model import, special stub for `User` with bcrypt, registers in `DatabaseSeeder.ts`, does not duplicate registration

---

### 4. `container.test.ts` — 7 tests

`TanisContainer` is the Laravel-style IoC container — resolves dependencies automatically by constructor parameter names.

- `bind` + `make` without dependencies
- Automatic dependency resolution by parameter name
- Dependency chain: `Controller → Service → Repository`
- `make()` accepts the class directly (without string)
- `make()` creates a new instance on every call (no singleton by default)
- `singleton()` always returns the same instance
- `singleton()` resolves dependencies on creation

---

### 5. `db-commands.test.ts` — 4 tests

Tests database commands with a mocked driver and temporary filesystem.

- **db:migrate** — runs migrations in ascending timestamp order
- **db:migrate** — does not run a migration that has already been executed
- **db:rollback** — executes the `down()` of the last run migration
- **db:seed** — executes the `DatabaseSeeder` and calls `run()`

---

### 6. `make-api.test.ts` — 14 tests

`make:api` generates 7 files at once for a complete entity.

**pluralize() — 8 tests:**

| Input | Output | Rule |
|---|---|---|
| `user` | `users` | default: +s |
| `watch` | `watches` | `-ch` → +es |
| `wish` | `wishes` | `-sh` → +es |
| `box` | `boxes` | `-x` → +es |
| `category` | `categories` | consonant+y → -ies |
| `day` | `days` | vowel+y → +s |

**makeApi() — 6 tests:** creates all 7 files, controller imports the correct service, repository uses the correct model, model uses the pluralized table name, does not overwrite existing, registers route in `app.ts`.

---

### 7. `make-extras.test.ts` — 14 tests

Tests individual generation commands with a temporary filesystem.

- **makeModel** — creates the file, extends `Model`, defines `static table`, imports the base, does not overwrite existing
- **makeService** — creates the file, contains the class and imports the Repository, does not overwrite existing
- **makeMiddleware** — creates the file, contains `req`, `res`, `next`, does not overwrite existing
- **makeRepository** — creates the file, imports the correct Model
- **makeSchema** — creates the schema file
- **makeUtil** — creates the `omitPassword.ts` and `twoFactor.ts` files

---

### 8. `model.test.ts` — 13 tests

Base model integrated with QueryBuilder.

- `all()`, `find(id)`, `create(data)`, `update()`, `delete()`
- Chained `where()` on Model
- `count()`, `exists()`
- `paginate(page, perPage)`
- Soft deletes — `deleted_at` filled on delete, excluded from select

---

### 9. `query-builder.test.ts` — 23 tests

The ORM's core — turns TypeScript calls into SQL.

**toSql() — 12 tests:**

| Call | Generated SQL |
|---|---|
| empty | `SELECT * FROM users` |
| `.where('role', 'admin')` | `WHERE role = "admin"` |
| `.where('age', '>', 18)` | `WHERE age > 18` |
| `.where().where()` | `WHERE ... AND ...` |
| `.whereIn('id', [1,2,3])` | `WHERE id IN (1, 2, 3)` |
| `.whereNotIn('id', [4,5])` | `WHERE id NOT IN (4, 5)` |
| `.whereLike('name', '%pedro%')` | `WHERE name LIKE "%pedro%"` |
| `.orderBy('name')` | `ORDER BY name ASC` |
| `.orderBy('created_at', 'desc')` | `ORDER BY created_at DESC` |
| `.limit(10).offset(20)` | `LIMIT 10 OFFSET 20` |
| `.select('id', 'name')` | `SELECT id, name FROM users` |
| Full pipeline | All combined correctly |

**Execution — 11 tests:** `get()`, `first()`, `all()`, `find(id)`, `count()`, `exists()`, `delete()`, `paginate(page, perPage)`

---

### 10. `request.test.ts` — 24 tests

Express `Request` wrapper with a more ergonomic API.

- **Body:** `input()`, `only()`, `except()`, `all()`, `has()`
- **Params/Query:** `param()`, `query()` with fallback and array
- **Headers:** `header()` case-insensitive, `bearerToken()`
- **Checks:** `method()`, `path()`, `url()`, `ip()`, `raw()`

---

### 11. `response.test.ts` — 16 tests

Express `Response` wrapper with semantic methods.

- **Success:** `ok()` 200, `created()` 201, `noContent()` 204, `json()`
- **Errors:** `badRequest()` 400, `unauthorized()` 401, `forbidden()` 403, `notFound()` 404, `unprocessable()` 422, `serverError()` 500
- **Headers:** `status()` with chaining, `setHeader()`, `raw()`

---

### 12. `router.test.ts` — 11 tests

HTTP router with resource route support.

- Registration of `get()`, `post()`, `put()`, `patch()`, `delete()`
- `resource()` registers all 5 REST routes — **only registers routes whose methods exist on the controller**
- `list()` includes the controller name
- Multiple resources accumulate routes correctly
- Chaining returns the router itself
- `build()` returns an Express Router with routes in the stack

---

### 13. `schema.test.ts` — 12 tests

Executes real DDL via mocked driver.

- `create()`: `CREATE TABLE IF NOT EXISTS`, `UNIQUE KEY`, nullable, `FOREIGN KEY`, `DEFAULT` string and numeric, `softDeletes`
- `drop()`: `DROP TABLE IF EXISTS`
- `hasTable()`: returns `true`/`false` based on the query result
- `addColumn()`: `ALTER TABLE ADD COLUMN`
- `dropColumn()`: `ALTER TABLE DROP COLUMN`

---

## Current results

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

## How to run

```bash
# run once
npm test

# watch mode (runs on every change)
npm run test:watch

# with code coverage
npm run test:coverage
```

---

> 🪐 DarkStar — Open Source