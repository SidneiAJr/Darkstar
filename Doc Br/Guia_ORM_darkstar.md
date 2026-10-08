# ORM — DarkStar

O ORM do DarkStar é composto por quatro camadas: **Connection**, **Model**, **QueryBuilder** e **Blueprint/Schema**. Cada camada tem responsabilidade única e você raramente precisa descer mais de um nível para fazer o que precisa.

---

## Sumário

- [Conexão](#conexão)
- [Model](#model)
- [QueryBuilder](#querybuilder)
  - [Select](#select)
  - [Where](#where)
  - [Ordenação, Limite e Offset](#ordenação-limite-e-offset)
  - [Executando queries](#executando-queries)
  - [Escrita](#escrita)
  - [Paginação](#paginação)
  - [Debug](#debug)
- [Blueprint — Tipos de coluna](#blueprint--tipos-de-coluna)
  - [Modificadores](#modificadores)
  - [Atalhos especiais](#atalhos-especiais)
  - [Chave estrangeira](#chave-estrangeira)
- [Schema — DDL em código](#schema--ddl-em-código)
- [Drivers suportados](#drivers-suportados)

---

## Conexão

A conexão é gerenciada pela classe `Connection`. Ela lê o `.env` e instancia o driver correto automaticamente. Você não instancia drivers na mão.

```env
DB_CONNECTION=mysql       # sqlite | mysql | mariadb | postgres
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=meu_banco
DB_USERNAME=root
DB_PASSWORD=secret
```

```typescript
import { Connection } from '@darkstar/orm'

await Connection.connect()    // conecta
await Connection.ping()       // boolean — está vivo?
await Connection.disconnect() // fecha o pool
```

> O `app.boot()` do DarkStar já chama `Connection.connect()` internamente. Você só precisa chamar isso diretamente em scripts avulsos ou testes.


---

## Model

Todo model estende `Model` e declara a tabela estática.

```typescript
import { Model } from '@darkstar/orm'

export class User extends Model {
  static table = 'users'
}
```

Isso é tudo. Os métodos de leitura e escrita já estão disponíveis.

### Métodos estáticos

| Método | Retorno | Descrição |
|---|---|---|
| `User.findAll()` | `User[]` | Todos os registros |
| `User.findById(id)` | `User \| null` | Busca por PK |
| `User.findBy(column, value)` | `User[]` | Busca por coluna |
| `User.findFirstBy(column, value)` | `User \| null` | Primeiro resultado por coluna |
| `User.create(data)` | `User` | Insere e retorna o registro criado |
| `User.update(id, data)` | `User \| null` | Atualiza por PK |
| `User.delete(id)` | `number` | Deleta por PK, retorna linhas afetadas |
| `User.query()` | `QueryBuilder` | Abre um QueryBuilder para essa tabela |

```typescript
// buscar todos
const users = await User.findAll()

// buscar por id
const user = await User.findById(1)

// buscar por coluna
const admins = await User.findBy('role', 'admin')

// primeiro resultado por coluna
const teste = await User.findFirstBy('email', 'teste@email.com')

// criar
const novo = await User.create({ name: 'teste', email: 'teste@email.com' })

// atualizar
await User.update(1, { name: 'teste teste' })

// deletar
await User.delete(1)
```

Quando você precisa de filtros compostos — `where` encadeado, `orderBy`, `limit` — use `User.query()` para acessar o QueryBuilder diretamente.

```typescript
const recentes = await User.query()
  .where('active', true)
  .orderBy('created_at', 'desc')
  .limit(10)
  .get()
```

---

## QueryBuilder

O QueryBuilder é o coração do ORM. Todos os métodos são encadeáveis e retornam `this`, exceto os métodos de execução que retornam uma `Promise`.

> **Comparação com Laravel:** o `User.query()` do DarkStar equivale ao `User::query()` do Eloquent. A API de encadeamento é intencionalmente parecida.

### Select

Por padrão retorna todas as colunas (`SELECT *`). Para restringir:

```typescript
const users = await User.query()
  .select('id', 'name', 'email')
  .get()
```

---

### Where

**Igualdade simples** — quando o operador é omitido, assume `=`:

```typescript
.where('role', 'admin')
// WHERE role = "admin"
```

**Com operador explícito** — operadores aceitos: `=` `!=` `>` `>=` `<` `<=` `LIKE` `IN` `NOT IN`:

```typescript
.where('age', '>', 18)
.where('status', '!=', 'banned')
```

**Múltiplos wheres** — encadeados com `AND`:

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
.whereLike('name', '%teste%')
// WHERE name LIKE "%teste%"
```

> O DarkStar não tem `orWhere` ainda. Múltiplos `.where()` sempre geram `AND`.

---

### Ordenação, Limite e Offset

```typescript
.orderBy('name')                  // ORDER BY name ASC  (padrão)
.orderBy('created_at', 'desc')   // ORDER BY created_at DESC

.limit(10)
.offset(20)
```

Todos encadeáveis:

```typescript
const resultado = await User.query()
  .where('active', true)
  .orderBy('created_at', 'desc')
  .limit(10)
  .offset(0)
  .get()
```

---

### Executando queries

| Método | Retorno | Descrição |
|---|---|---|
| `.get()` | `T[]` | Executa e retorna todos os resultados |
| `.first()` | `T \| null` | Aplica `LIMIT 1` e retorna o primeiro |
| `.find(id)` | `T \| null` | `WHERE id = ?` direto, ignora wheres anteriores |
| `.all()` | `T[]` | `SELECT *` sem filtros, ignora wheres anteriores |
| `.count()` | `number` | `SELECT COUNT(*)` com os filtros aplicados |
| `.exists()` | `boolean` | `count() > 0` |

```typescript
// retorna array
const users = await User.query().where('active', true).get()

// retorna um ou null
const user = await User.query().where('email', 'teste@email.com').first()

// conta
const total = await User.query().where('role', 'admin').count()

// existe?
const existe = await User.query().where('email', 'teste@email.com').exists()
```

---

### Escrita

**create** — insere e retorna o registro recém-criado:

```typescript
const user = await User.query().create({
  name: 'teste',
  email: 'teste@email.com',
  role: 'admin',
})
```

**update** — atualiza as linhas que batem com os wheres, retorna linhas afetadas:

```typescript
const afetadas = await User.query()
  .where('id', 1)
  .update({ name: 'teste teste' })
```

**delete** — deleta as linhas que batem com os wheres, retorna linhas afetadas:

```typescript
const afetadas = await User.query()
  .where('id', 1)
  .delete()
```

> Sem `.where()` antes de `.update()` ou `.delete()`, a operação afeta **todas** as linhas da tabela. Sempre filtre.

---

### Paginação

```typescript
const pagina = await User.query()
  .where('active', true)
  .paginate(1, 15)
```

Retorna:

```typescript
{
  data:     User[],   // registros da página atual
  total:    number,   // total de registros sem paginação
  page:     number,   // página atual
  perPage:  number,   // itens por página
  lastPage: number,   // última página
}
```

> **Comparação com Laravel:** equivale ao `->paginate(15)` do Eloquent, mas retorna um objeto simples em vez de um `LengthAwarePaginator`.

---

### Debug

`.toSql()` retorna a query com os bindings interpolados, sem executar nada:

```typescript
const sql = User.query()
  .where('role', 'admin')
  .orderBy('name')
  .limit(10)
  .toSql()

// SELECT * FROM users WHERE role = "admin" ORDER BY name ASC LIMIT 10
console.log(sql)
```

Útil para inspecionar a query antes de mandar pro banco.

---

## Blueprint — Tipos de coluna

O `Blueprint` é usado dentro de migrations para definir a estrutura da tabela.

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

### Tipos disponíveis

| Método | SQL gerado | Observação |
|---|---|---|
| `id()` | `BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY` | PK padrão |
| `uuid(name?)` | `VARCHAR(36) PRIMARY KEY UNIQUE` | PK em UUID, padrão `'id'` |
| `string(name, length?)` | `VARCHAR(255)` | length padrão 255 |
| `text(name)` | `TEXT` | |
| `longText(name)` | `LONGTEXT` | |
| `integer(name)` | `INT` | |
| `bigInteger(name)` | `BIGINT` | |
| `float(name, p?, s?)` | `FLOAT(8,2)` | precision e scale configuráveis |
| `decimal(name, p?, s?)` | `DECIMAL(8,2)` | precision e scale configuráveis |
| `boolean(name)` | `TINYINT(1)` | igual ao padrão MySQL/Laravel |
| `date(name)` | `DATE` | |
| `dateTime(name)` | `DATETIME` | |
| `timestamp(name)` | `TIMESTAMP` | |
| `json(name)` | `JSON` | |

### Modificadores

Todos os tipos (exceto `id()`, `uuid()` e os atalhos) retornam um `ColumnBuilder` encadeável:

| Modificador | Efeito |
|---|---|
| `.nullable()` | Permite `NULL` |
| `.unique()` | Adiciona `UNIQUE KEY` |
| `.default(value)` | Define valor padrão |
| `.unsigned()` | Adiciona `UNSIGNED` |

```typescript
table.string('email').unique()
table.string('avatar').nullable()
table.integer('pontos').default(0).unsigned()
table.string('token', 64).nullable().unique()
```

### Atalhos especiais

**`timestamps()`** — cria `created_at` e `updated_at` automaticamente:

```typescript
table.timestamps()
// created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

> Igual ao `$table->timestamps()` do Laravel.

**`softDeletes()`** — adiciona `deleted_at` nullable para deleção lógica:

```typescript
table.softDeletes()
// deleted_at TIMESTAMP NULL
```

> Igual ao `$table->softDeletes()` do Laravel. O model filtra `deleted_at IS NULL` automaticamente em `findAll`, `findBy` e `query().get()`.

### Chave estrangeira

```typescript
table.foreignId('user_id').references('id').on('users')
```

Gera:

```sql
`user_id` BIGINT UNSIGNED NOT NULL,
CONSTRAINT `fk_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
```

> O `foreignId` sempre cria a coluna como `BIGINT UNSIGNED NOT NULL`. Para nullable, encadeie `.nullable()` antes de `.references()`.

---

## Schema — DDL em código

O `Schema` executa operações DDL (criar tabela, dropar, alterar colunas) usando o driver ativo.

```typescript
import { Schema, Blueprint } from '@darkstar/orm'
import { Connection } from '@darkstar/orm'

const schema = new Schema(Connection.get())
```

### Criar tabela

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

Gera `CREATE TABLE IF NOT EXISTS` — seguro rodar mais de uma vez.

### Dropar tabela

```typescript
await schema.drop('products')
// DROP TABLE IF EXISTS `products`
```

### Verificar se tabela existe

```typescript
const existe = await schema.hasTable('products') // boolean
```

### Adicionar coluna

```typescript
await schema.addColumn('users', (table: Blueprint) => {
  table.string('phone').nullable()
})
// ALTER TABLE `users` ADD COLUMN `phone` VARCHAR(255) NULL
```

### Remover coluna

```typescript
await schema.dropColumn('users', 'phone')
// ALTER TABLE `users` DROP COLUMN `phone`
```

---

## Drivers suportados

| Driver | `DB_CONNECTION` | Dependência |
|---|---|---|
| MySQL | `mysql` | `mysql2` |
| MariaDB | `mariadb` | `mysql2` |
| PostgreSQL | `postgres` | `pg` |
| SQLite | `sqlite` | `better-sqlite3` |

Todos os drivers implementam a mesma interface `BaseDriver`:

```typescript
interface BaseDriver {
  connect(): Promise<void>
  disconnect(): Promise<void>
  query<T>(sql: string, bindings?: any[]): Promise<QueryResult<T>>
  ping(): Promise<boolean>
  type(): 'sqlite' | 'mysql' | 'mariadb' | 'postgres'
}
```

Você pode implementar um driver customizado respeitando essa interface e passar para o `Connection` manualmente se precisar de um banco não suportado.