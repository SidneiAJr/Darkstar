# ORM — DarkStar

The DarkStar ORM is made up of four layers: **Connection**, **Model**, **QueryBuilder**, and **Blueprint/Schema**. Each layer has a single responsibility and you rarely need to go more than one level deep to get things done.

---

## Table of Contents

- [Connection](#connection)
- [Model](#model)
- [QueryBuilder](#querybuilder)
  - [Select](#select)
  - [Where](#where)
  - [Ordering, Limit and Offset](#ordering-limit-and-offset)
  - [Executing queries](#executing-queries)
  - [Write operations](#write-operations)
  - [Pagination](#pagination)
  - [Debug](#debug)
- [Blueprint — Column types](#blueprint--column-types)
  - [Modifiers](#modifiers)
  - [Special shortcuts](#special-shortcuts)
  - [Foreign key](#foreign-key)
- [Schema — DDL in code](#schema--ddl-in-code)
- [Supported drivers](#supported-drivers)

---

## Connection

The connection is managed by the `Connection` class. It reads `.env` and automatically instantiates the correct driver. You don't instantiate drivers manually.

```env
DB_CONNECTION=mysql       # sqlite | mysql | mariadb | postgres
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=my_database
DB_USERNAME=root
DB_PASSWORD=secret
```

```typescript
import { Connection } from '@darkstar/orm'

await Connection.connect()    // connect
await Connection.ping()       // boolean — is it alive?
await Connection.disconnect() // close the pool
```

> DarkStar's `app.boot()` already calls `Connection.connect()` internally. You only need to call this directly in standalone scripts or tests.

---

## Model

Every model extends `Model` and declares a static table name.

```typescript
import { Model } from '@darkstar/orm'

export class User extends Model {
  static table = 'users'
}
```

That's all. Read and write methods are already available.

### Static methods

| Method | Return | Description |
|---|---|---|
| `User.findAll()` | `User[]` | All records |
| `User.findById(id)` | `User \| null` | Find by primary key |
| `User.findBy(column, value)` | `User[]` | Find by column |
| `User.findFirstBy(column, value)` | `User \| null` | First result by column |
| `User.create(data)` | `User` | Insert and return the created record |
| `User.update(id, data)` | `User \| null` | Update by primary key |
| `User.delete(id)` | `number` | Delete by primary key, returns affected rows |
| `User.query()` | `QueryBuilder` | Opens a QueryBuilder for this table |

```typescript
// get all
const users = await User.findAll()

// find by id
const user = await User.findById(1)

// find by column
const admins = await User.findBy('role', 'admin')

// first result by column
const pedro = await User.findFirstBy('email', 'pedro@email.com')

// create
const newUser = await User.create({ name: 'Pedro', email: 'pedro@email.com' })

// update
await User.update(1, { name: 'Pedro Henrique' })

// delete
await User.delete(1)
```

When you need compound filters — chained `where`, `orderBy`, `limit` — use `User.query()` to access the QueryBuilder directly.

```typescript
const recent = await User.query()
  .where('active', true)
  .orderBy('created_at', 'desc')
  .limit(10)
  .get()
```

---

## QueryBuilder

The QueryBuilder is the heart of the ORM. All methods are chainable and return `this`, except execution methods which return a `Promise`.

> **Comparison with Laravel:** `User.query()` in DarkStar is equivalent to `User::query()` in Eloquent. The chaining API is intentionally similar.

### Select

By default returns all columns (`SELECT *`). To restrict:

```typescript
const users = await User.query()
  .select('id', 'name', 'email')
  .get()
```

---

### Where

**Simple equality** — when the operator is omitted, assumes `=`:

```typescript
.where('role', 'admin')
// WHERE role = "admin"
```

**With explicit operator** — accepted operators: `=` `!=` `>` `>=` `<` `<=` `LIKE` `IN` `NOT IN`:

```typescript
.where('age', '>', 18)
.where('status', '!=', 'banned')
```

**Multiple wheres** — chained with `AND`:

```typescript
.where('role', 'admin')
.where('active', true)
// WHERE role = "admin" AND active = true
```

**whereIn / whereNotIn**:

```typescript
.whereIn('id', [1, 2, 3])
// WHERE id IN (1, 2, 3)

.whereNotIn('status', ['banned', 'suspended'])
// WHERE status NOT IN ("banned", "suspended")
```

**whereLike**:

```typescript
.whereLike('name', '%pedro%')
// WHERE name LIKE "%pedro%"
```

> DarkStar does not have `orWhere` yet. Multiple `.where()` calls always generate `AND`.

---

### Ordering, Limit and Offset

```typescript
.orderBy('name')                  // ORDER BY name ASC  (default)
.orderBy('created_at', 'desc')   // ORDER BY created_at DESC

.limit(10)
.offset(20)
```

All chainable:

```typescript
const result = await User.query()
  .where('active', true)
  .orderBy('created_at', 'desc')
  .limit(10)
  .offset(0)
  .get()
```

---

### Executing queries

| Method | Return | Description |
|---|---|---|
| `.get()` | `T[]` | Execute and return all results |
| `.first()` | `T \| null` | Applies `LIMIT 1` and returns the first |
| `.find(id)` | `T \| null` | `WHERE id = ?` directly, ignores previous wheres |
| `.all()` | `T[]` | `SELECT *` without filters, ignores previous wheres |
| `.count()` | `number` | `SELECT COUNT(*)` with applied filters |
| `.exists()` | `boolean` | `count() > 0` |

```typescript
// returns array
const users = await User.query().where('active', true).get()

// returns one or null
const user = await User.query().where('email', 'pedro@email.com').first()

// count
const total = await User.query().where('role', 'admin').count()

// exists?
const exists = await User.query().where('email', 'pedro@email.com').exists()
```

---

### Write operations

**create** — inserts and returns the newly created record:

```typescript
const user = await User.query().create({
  name: 'Pedro',
  email: 'pedro@email.com',
  role: 'admin',
})
```

**update** — updates the rows matching the wheres, returns affected rows:

```typescript
const affected = await User.query()
  .where('id', 1)
  .update({ name: 'Pedro Henrique' })
```

**delete** — deletes the rows matching the wheres, returns affected rows:

```typescript
const affected = await User.query()
  .where('id', 1)
  .delete()
```

> Without `.where()` before `.update()` or `.delete()`, the operation affects **all** rows in the table. Always filter first.

---

### Pagination

```typescript
const page = await User.query()
  .where('active', true)
  .paginate(1, 15)
```

Returns:

```typescript
{
  data:     User[],   // records on the current page
  total:    number,   // total records without pagination
  page:     number,   // current page
  perPage:  number,   // items per page
  lastPage: number,   // last page
}
```

> **Comparison with Laravel:** equivalent to `->paginate(15)` in Eloquent, but returns a plain object instead of a `LengthAwarePaginator`.

---

### Debug

`.toSql()` returns the query with interpolated bindings, without executing anything:

```typescript
const sql = User.query()
  .where('role', 'admin')
  .orderBy('name')
  .limit(10)
  .toSql()

// SELECT * FROM users WHERE role = "admin" ORDER BY name ASC LIMIT 10
console.log(sql)
```

Useful for inspecting the query before sending it to the database.

---

## Blueprint — Column types

`Blueprint` is used inside migrations to define the table structure.

```typescript
import { Schema, Blueprint } from '@darkstar/orm'

await schema.create('users', (table: Blueprint) => {
  table.id()
  table.string('name')
  table.string('email').unique()
  table.string('password')
  table.boolean('active').default(true)
  table.timestamps()
})
```

### Available types

| Method | Generated SQL | Notes |
|---|---|---|
| `id()` | `BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY` | Default PK |
| `uuid(name?)` | `VARCHAR(36) PRIMARY KEY UNIQUE` | UUID PK, defaults to `'id'` |
| `string(name, length?)` | `VARCHAR(255)` | Default length 255 |
| `text(name)` | `TEXT` | |
| `longText(name)` | `LONGTEXT` | |
| `integer(name)` | `INT` | |
| `bigInteger(name)` | `BIGINT` | |
| `float(name, p?, s?)` | `FLOAT(8,2)` | Configurable precision and scale |
| `decimal(name, p?, s?)` | `DECIMAL(8,2)` | Configurable precision and scale |
| `boolean(name)` | `TINYINT(1)` | Same as MySQL/Laravel default |
| `date(name)` | `DATE` | |
| `dateTime(name)` | `DATETIME` | |
| `timestamp(name)` | `TIMESTAMP` | |
| `json(name)` | `JSON` | |

### Modifiers

All types (except `id()`, `uuid()` and shortcuts) return a chainable `ColumnBuilder`:

| Modifier | Effect |
|---|---|
| `.nullable()` | Allows `NULL` |
| `.unique()` | Adds `UNIQUE KEY` |
| `.default(value)` | Sets a default value |
| `.unsigned()` | Adds `UNSIGNED` |

```typescript
table.string('email').unique()
table.string('avatar').nullable()
table.integer('points').default(0).unsigned()
table.string('token', 64).nullable().unique()
```

### Special shortcuts

**`timestamps()`** — creates `created_at` and `updated_at` automatically:

```typescript
table.timestamps()
// created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

> Same as `$table->timestamps()` in Laravel.

**`softDeletes()`** — adds a nullable `deleted_at` for soft deletion:

```typescript
table.softDeletes()
// deleted_at TIMESTAMP NULL
```

> Same as `$table->softDeletes()` in Laravel. The model automatically filters `deleted_at IS NULL` in `findAll`, `findBy` and `query().get()`.

### Foreign key

```typescript
table.foreignId('user_id').references('id').on('users')
```

Generates:

```sql
`user_id` BIGINT UNSIGNED NOT NULL,
CONSTRAINT `fk_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
```

> `foreignId` always creates the column as `BIGINT UNSIGNED NOT NULL`. For nullable, chain `.nullable()` before `.references()`.

---

## Schema — DDL in code

`Schema` executes DDL operations (create table, drop, alter columns) using the active driver.

```typescript
import { Schema, Blueprint } from '@darkstar/orm'
import { Connection } from '@darkstar/orm'

const schema = new Schema(Connection.get())
```

### Create table

```typescript
await schema.create('products', (table: Blueprint) => {
  table.id()
  table.string('name')
  table.decimal('price', 10, 2)
  table.integer('stock').default(0)
  table.foreignId('category_id').references('id').on('categories')
  table.timestamps()
})
```

Generates `CREATE TABLE IF NOT EXISTS` — safe to run more than once.

### Drop table

```typescript
await schema.drop('products')
// DROP TABLE IF EXISTS `products`
```

### Check if table exists

```typescript
const exists = await schema.hasTable('products') // boolean
```

### Add column

```typescript
await schema.addColumn('users', (table: Blueprint) => {
  table.string('phone').nullable()
})
// ALTER TABLE `users` ADD COLUMN `phone` VARCHAR(255) NULL
```

### Remove column

```typescript
await schema.dropColumn('users', 'phone')
// ALTER TABLE `users` DROP COLUMN `phone`
```

---

## Supported drivers

| Driver | `DB_CONNECTION` | Dependency |
|---|---|---|
| MySQL | `mysql` | `mysql2` |
| MariaDB | `mariadb` | `mysql2` |
| PostgreSQL | `postgres` | `pg` |
| SQLite | `sqlite` | `better-sqlite3` |

All drivers implement the same `BaseDriver` interface:

```typescript
interface BaseDriver {
  connect(): Promise<void>
  disconnect(): Promise<void>
  query<T>(sql: string, bindings?: any[]): Promise<QueryResult<T>>
  ping(): Promise<boolean>
  type(): 'sqlite' | 'mysql' | 'mariadb' | 'postgres'
}
```

You can implement a custom driver respecting this interface and pass it to `Connection` manually if you need an unsupported database.