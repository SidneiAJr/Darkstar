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

const users = await User.findAll()
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
  static softDelete = true   // enables soft delete
  static relations = { /* ... */ }
}
```

### Methods

| Method | Description |
|---|---|
| `User.findAll()` | Fetch all records |
| `User.findById(id)` | Fetch by primary key |
| `User.findOrFail(id)` | Fetch by primary key or throw |
| `User.findBy(column, value)` | Fetch all matching |
| `User.findFirstBy(column, value)` | Fetch first matching |
| `User.firstOrCreate(search, data?)` | Fetch first matching or create |
| `User.updateOrCreate(search, data)` | Update matching or create |
| `User.create(data)` | Insert, returns created record |
| `User.createMany(rows[])` | Bulk insert, returns affected rows |
| `User.update(id, data)` | Update, returns updated record |
| `User.delete(id)` | Delete (soft delete if enabled) |
| `User.restore(id)` | Restore soft-deleted record |
| `User.withTrashed()` | Query including soft-deleted |
| `User.onlyTrashed()` | Query only soft-deleted |
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
  .orWhere('role', 'superadmin')
  .whereNull('deleted_at')
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
| `.orWhere(col, value)` | `OR WHERE col = value` |
| `.whereIn(col, values[])` | `WHERE col IN (...)` |
| `.whereNotIn(col, values[])` | `WHERE col NOT IN (...)` |
| `.whereLike(col, str)` | `WHERE col LIKE str` |
| `.whereNull(col)` | `WHERE col IS NULL` |
| `.whereNotNull(col)` | `WHERE col IS NOT NULL` |
| `.orderBy(col, dir)` | `ORDER BY` |
| `.limit(n)` / `.offset(n)` | `LIMIT` / `OFFSET` |
| `.with(...relations)` | Eager loading |
| `.withTrashed()` | Include soft-deleted records |
| `.onlyTrashed()` | Only soft-deleted records |
| `.get()` | Returns `T[]` |
| `.first()` | Returns `T \| null` |
| `.firstOrFail()` | Returns `T` or throws |
| `.find(id)` | Returns `T \| null` |
| `.findOrFail(id)` | Returns `T` or throws |
| `.all()` | Returns `T[]` (no soft delete filter) |
| `.count()` | Returns `number` |
| `.exists()` | Returns `boolean` |
| `.create(data)` | Insert, returns created record |
| `.createMany(rows[])` | Bulk insert, returns affected rows |
| `.update(data)` | Update, returns affected rows |
| `.delete()` | Delete (soft delete if enabled) |
| `.restore()` | Restore soft-deleted records |
| `.paginate(page, perPage)` | Returns `{ data, total, page, perPage, lastPage }` |
| `.toSql()` | Debug: returns the SQL string |

---

## Transactions

```typescript
import { Connection } from '@darkstar-cli/orm'

await Connection.transaction(async (driver) => {
  await User.create({ name: 'test' })
  await Profile.create({ user_id: 1, bio: '...' })
  // if any fails, both are rolled back
})
```

Supported on MySQL, MariaDB, PostgreSQL and SQLite.

---

## Soft Delete

Enable on the model:

```typescript
export class Post extends Model {
  static table = 'posts'
  static softDelete = true
}
```

```typescript
// delete sets deleted_at instead of removing the row
await Post.delete(1)

// normal queries exclude soft-deleted automatically
await Post.findAll()

// include soft-deleted
await Post.withTrashed().get()

// only soft-deleted
await Post.onlyTrashed().get()

// restore
await Post.restore(1)
```

---

## Relationships

DarkStar supports `hasOne`, `hasMany`, `belongsTo` and `belongsToMany`.

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
const users = await User.query().with('posts').get()
const posts = await Post.query().with('user').get()
const users = await User.query().with('posts', 'profile').get()
```

### Supported relation types

| Type | Direction | Example |
|------|-----------|---------|
| `hasOne` | 1 → 1 | User hasOne Profile |
| `hasMany` | 1 → N | User hasMany Posts |
| `belongsTo` | N → 1 | Post belongsTo User |
| `belongsToMany` | N → N | Post belongsToMany Tags |

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
  table.softDeletes()
})
```

### Methods

| Method | Description |
|---|---|
| `schema.create(table, cb)` | CREATE TABLE |
| `schema.drop(table)` | DROP TABLE |
| `schema.hasTable(table)` | Returns boolean |
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
| `table.boolean(name)` | `BOOLEAN` (adapter per driver) |
| `table.date(name)` / `dateTime` / `timestamp` / `time` / `year` | (equivalents) |
| `table.json(name)` | `JSON` / `JSONB` on PostgreSQL |
| `table.binary(name)` | `BLOB` / `BYTEA` on PostgreSQL |
| `table.enum(name, values[])` | `ENUM(...)` / `TEXT` on SQLite |
| `table.foreignId(name)` | `BIGINT UNSIGNED` + FK builder |
| `table.nullableForeignId(name)` | nullable `BIGINT UNSIGNED` + FK builder |
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
| `.nullable()` | Allows NULL |
| `.notNullable()` | Disallows NULL |
| `.unique()` | Adds UNIQUE constraint |
| `.default(value)` | Sets DEFAULT value |
| `.unsigned()` | Adds UNSIGNED (MySQL only) |

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
DB_PASSWORD=
DB_DATABASE=myapp
```

`DB_CLIENT` is accepted as an alias for `DB_CONNECTION`.

---

## Known limitations

- **No nested eager loading** — `.with('posts.comments')` is not supported. Load each level separately.
- **No lazy loading** — `user.posts()` is not supported. Always use `.with('posts')`.
- **`hidden` fields on relations** — not stripped automatically on nested records. Strip manually with `Model.omitHidden()`.
- **SQLite concurrent migrations** — unsafe without external locking.

---

## License

MIT