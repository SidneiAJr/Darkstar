> [!WARNING]
> 🚧 O DarkStar está em desenvolvimento ativo. Não use em produção — APIs podem mudar sem aviso.

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
| `darkstar forge make:api <Nome>` | Gera controller + service + repository + model + rotas CRUD |
| `darkstar forge make:controller <Nome>` | Gera um Controller |
| `darkstar forge make:service <Nome>` | Gera um Service |
| `darkstar forge make:repository <Nome>` | Gera um Repository |
| `darkstar forge make:model <Nome>` | Gera um Model |
| `darkstar forge make:migration <Nome>` | Gera uma Migration |
| `darkstar forge make:seeder <Nome>` | Gera um Seeder |
| `darkstar forge db:create` | Cria o banco de dados |
| `darkstar forge db:migrate` | Roda as migrations pendentes |
| `darkstar forge db:rollback` | Desfaz a última migration |
| `darkstar forge db:seed` | Popula o banco com seeders |

---

## Estrutura gerada pelo `make:api`

Um único comando `darkstar forge make:api User` gera toda a cadeia MVC:

**`UserController.ts`**

```typescript
import { TanisRequest, TanisResponse } from '@darkstar/core'
import { UserService } from '../services/UserService'

export class UserController {
  constructor(private userService: UserService) {}

  async index(req: TanisRequest, res: TanisResponse) {
    const data = await this.userService.findAll()
    return res.ok(data)
  }

  async show(req: TanisRequest, res: TanisResponse) {
    const data = await this.userService.findById(req.param('id')!)
    if (!data) return res.notFound('User não encontrado')
    return res.ok(data)
  }

  async store(req: TanisRequest, res: TanisResponse) {
    const data = await this.userService.create(req.all())
    return res.created(data)
  }

  async update(req: TanisRequest, res: TanisResponse) {
    const data = await this.userService.update(req.param('id')!, req.all())
    return res.ok(data)
  }

  async destroy(req: TanisRequest, res: TanisResponse) {
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
const user = await User.create({ name: 'Sidnei', email: 'sid@email.com' })

// atualizar
await User.where('id', 1).update({ name: 'Sidnei Jr' })

// deletar
await User.where('id', 1).delete()
```

---

## Inspirações

- **Laravel** — pela elegância e produtividade
- **Pandorum** — pela ideia de forjar algo novo no vácuo do espaço
- **Constellation CLI** — mesmo espírito de automatizar o que é repetitivo

---

> 🪐 DarkStar — Open Source
