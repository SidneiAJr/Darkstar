# @darkstar-cli/orm

> Custom Eloquent-style ORM for Node.js — part of the [DarkStar](https://github.com/SidneiAJr/Darkstar) framework.

> [!WARNING]
> **Early alpha.** APIs will change without notice.

## Installation

```bash
npm install @darkstar-cli/orm
```

## Quick start

```typescript
import { Connection, Model } from '@darkstar-cli/orm'

await Connection.connect()

class User extends Model {
  static table = 'users'
}

const users = await User.all()
```

The connection reads `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=secret
DB_DATABASE=myapp
```

---

## Model

```typescript
import { Model } from '@darkstar-cli/orm'

export class User extends Model {
  static table = 'users'
  static hidden = ['password']
  static relations = { /* ... */ }
}
```

### Methods

| Method | Description |
|---|---|
| `User.all()` | Fetch all records |
| `User.find(id)` | Fetch by primary key |
| `User.findById(id)` | Alias for `find` |
| `User.findBy(column, value)` | Fetch all matching |
| `User.findFirstBy(column, value)` | Fetch first matching |
| `User.create(data)` | Insert |
| `User.update(id, data)` | Update (returns affected rows) |
| `User.delete(id)` | Delete |
| `User.query()` | Returns a `QueryBuilder` |
| `User.omitHidden(obj)` | Remove fields declared in `static hidden` |

---

## QueryBuilder

```typescript
const users = await User
  .query()
  .where('active', true)
  .where('age', '>', 18)
  .whereIn('role', ['admin', 'moderator'])
  .orderBy('name', 'asc')
  .limit(10)
  .offset(0)
  .get()
```

### Methods

| Method | Description |
|---|---|
| `.where(col, value)` | `WHERE col = value` |
| `.where(col, operator, value)` | `WHERE col operator value` |
| `.whereIn(col, values[])` | `WHERE col IN (...)` |
| `.whereNotIn(col, values[])` | `WHERE col NOT IN (...)` |
| `.whereLike(col, str)` | `WHERE col LIKE str` |
| `.orderBy(col, dir)` | `ORDER BY` |
| `.limit(n)` / `.offset(n)` | `LIMIT` / `OFFSET` |
| `.with(...relations)` | Eager loading (see Relationships) |
| `.get()` | Returns `T[]` |
| `.first()` | Returns `T \| null` |
| `.find(id)` | Returns `T \| null` |
| `.all()` | Returns `T[]` |
| `.count()` | Returns `number` |
| `.exists()` | Returns `boolean` |
| `.create(data)` | Insert, returns the created record |
| `.update(data)` | Update, returns affected rows |
| `.delete()` | Delete, returns affected rows |
| `.paginate(page, perPage)` | Returns `{ data, total, page, perPage, lastPage }` |
| `.toSql()` | Debug: returns the SQL string |

---

## Relationships

DarkStar supports `hasOne`, `hasMany`, `belongsTo` and `belongsToMany` via a Laravel-style API.

### Declaring relations

```typescript
// src/models/User.ts
import { Model, type RelationsMap } from '@darkstar-cli/orm'
import { Post } from './Post'

export class User extends Model {
  static table = 'users'
  static hidden = ['password']

  static relations: RelationsMap = {
    posts: {
      type: 'hasMany',
      model: () => Post,
      foreignKey: 'user_id',
    }
  }
}
```

```typescript
// src/models/Post.ts
import { Model, type RelationsMap } from '@darkstar-cli/orm'
import { User } from './User'

export class Post extends Model {
  static table = 'posts'

  static relations: RelationsMap = {
    user: {
      type: 'belongsTo',
      model: () => User,
      foreignKey: 'user_id',
    }
  }
}
```

### Eager loading — `.with()`

```typescript
// users with their posts (2 queries, no N+1)
const users = await User.query().with('posts').get()

// posts with their author
const posts = await Post.query().with('user').get()

// multiple relations
const users = await User.query().with('posts', 'profile').get()
```

### Supported relation types

| Type | Direction | Example |
|------|-----------|---------|
| `hasOne` | 1 → 1 | User hasOne Profile |
| `hasMany` | 1 → N | User hasMany Posts |
| `belongsTo` | N → 1 | Post belongsTo User |
| `belongsToMany` | N → N | Post belongsToMany Tags (pivot) |

### `hasOne` example

```typescript
static relations: RelationsMap = {
  profile: {
    type: 'hasOne',
    model: () => Profile,
    foreignKey: 'user_id',
  }
}
```

### `belongsToMany` example

```typescript
static relations: RelationsMap = {
  tags: {
    type: 'belongsToMany',
    model: () => Tag,
    pivotTable: 'post_tag',
    pivotForeignKey: 'post_id',
    pivotRelatedKey: 'tag_id',
  }
}
```

### Nested `$hidden`

The `$hidden` fields of **related** models are **not** stripped automatically in nested responses. Strip them manually:

```typescript
const posts = await Post.query().with('user').get()

const clean = posts.map((post: any) => {
  const { user, ...rest } = post
  return { ...rest, user: user ? User.omitHidden(user) : null }
})
```

---

## Schema / Blueprint

```typescript
import { Schema, Blueprint, Connection } from '@darkstar-cli/orm'

const schema = new Schema(Connection.get())

await schema.create('users', (table: Blueprint) => {
  table.id()
  table.string('name')
  table.string('email').unique()
  table.string('password')
  table.boolean('active').default(true)
  table.timestamps()
})
```

### Methods

| Method | Description |
|---|---|
| `schema.create(table, cb)` | CREATE TABLE |
| `schema.drop(table)` | DROP TABLE |
| `schema.hasTable(table)` | Returns boolean (MySQL only) |
| `schema.addColumn(table, cb)` | ALTER TABLE ADD COLUMN |
| `schema.dropColumn(table, col)` | ALTER TABLE DROP COLUMN |
| `schema.renameTable(from, to)` | RENAME TABLE |
| `schema.truncate(table)` | TRUNCATE TABLE |

### Column types

| Blueprint method | SQL type |
|---|---|
| `table.id()` | `BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY` |
| `table.uuid(name)` | `VARCHAR(36) PRIMARY KEY` |
| `table.string(name, length?)` | `VARCHAR(length)` |
| `table.char(name, length?)` | `CHAR(length)` |
| `table.text(name)` | `TEXT` |
| `table.mediumText(name)` | `MEDIUMTEXT` |
| `table.longText(name)` | `LONGTEXT` |
| `table.integer(name)` | `INT` |
| `table.bigInteger(name)` | `BIGINT` |
| `table.tinyInt(name)` / `smallInt` | `TINYINT` / `SMALLINT` |
| `table.float(name, p, s)` / `double` / `decimal` | `FLOAT` / `DOUBLE` / `DECIMAL` |
| `table.boolean(name)` | `TINYINT(1)` |
| `table.date(name)` / `dateTime` / `timestamp` / `time` / `year` | (equivalentes) |
| `table.json(name)` | `JSON` |
| `table.binary(name)` | `BLOB` |
| `table.enum(name, values[])` | `ENUM(...)` |
| `table.foreignId(name)` | `BIGINT UNSIGNED` + FK builder |
| `table.timestamps()` | `created_at` + `updated_at` |
| `table.softDeletes()` | `deleted_at` (nullable) |

### Column modifiers

```typescript
table.string('email').unique()
table.string('name').nullable()
table.boolean('active').default(true)
table.string('bio').nullable().default(null)
```

| Modifier | Effect |
|---|---|
| `.nullable()` | Adds `NULL` |
| `.unique()` | Adds `UNIQUE KEY` |
| `.default(value)` | Adds `DEFAULT value` |
| `.unsigned()` | Adds `UNSIGNED` |

### Foreign keys

```typescript
table.foreignId('user_id').references('id').on('users').cascadeOnDelete()
```

| Method | Effect |
|---|---|
| `.references(col)` | Column referenced on the other table |
| `.on(table)` | Table referenced |
| `.onDelete(action)` | `CASCADE` \| `SET NULL` \| `RESTRICT` \| `NO ACTION` |
| `.onUpdate(action)` | Same actions |
| `.cascadeOnDelete()` | Shortcut for `onDelete('CASCADE')` |
| `.nullOnDelete()` | `nullable` + `onDelete('SET NULL')` |
| `.restrictOnDelete()` | `onDelete('RESTRICT')` |

---

## Drivers

| Driver | `DB_CONNECTION` | Depends on |
|--------|-----------------|------------|
| MySQL | `mysql` | `mysql2` |
| MariaDB | `mariadb` | `mysql2` |
| PostgreSQL | `postgres` | `pg` |
| SQLite | `sqlite` | `better-sqlite3` |

### Environment variables

```env
DB_CONNECTION=mysql    # mysql | mariadb | postgres | sqlite
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root           # also accepts DB_USERNAME
DB_PASSWORD=secret
DB_DATABASE=myapp
```

`DB_CLIENT` is accepted as an alias for `DB_CONNECTION`. `DB_USERNAME` and `DB_USER` are both accepted.

---

## Known limitations

- **Schema builder is MySQL/MariaDB only** — PostgreSQL and SQLite migrations must use raw SQL.
- **`update()` returns the number of affected rows, not the record** — re-fetch if you need the new values.
- **No transaction API** — no `DB.transaction(callback)`. Manage manually through the raw driver.
- **No nested eager loading** — `.with('posts.comments')` is not supported. Load each level separately.
- **No lazy loading** — `user.posts()` (direct access) is not supported. Always use `.with('posts')`.
- **SQLite has no advisory locks** — `db:migrate` uses `GET_LOCK` (MySQL) and `pg_advisory_lock` (PostgreSQL). SQLite migrations in parallel are unsafe.
- **`hasTable()` uses `SHOW TABLES`** — MySQL only.

---

## License

MIT