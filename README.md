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
- Qual banco de dados? (MySQL · PostgreSQL · SQLite)
- Qual ORM? (DarkStar ORM · TypeORM · Prisma)
- Usar autenticação JWT? (sim/não)

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
│       └── app.ts        # núcleo da aplicação
├── database/
│   ├── migrations/
│   └── seeders/
├── .env
├── darkstar.config.ts
└── package.json
```

---

## CLI — DarkStar Forge

### Subir o servidor

```bash
darkstar serve
```

### Gerar arquivos

```bash
darkstar forge make:controller User   # cria UserController com métodos básicos
darkstar forge make:model User        # cria User model + migration
darkstar forge make:service User      # cria UserService
darkstar forge make:repository User   # cria UserRepository
darkstar forge make:api User          # gera controller + service + repository + rotas CRUD completas
```

### Banco de dados

```bash
darkstar forge db:migrate             # roda as migrations pendentes
darkstar forge db:rollback            # desfaz a última migration
darkstar forge db:seed                # popula o banco com seeders
```

---

## Estrutura gerada pelo `make:api`

Um único comando `darkstar forge make:api User` gera toda a cadeia MVC:

**`UserController.ts`**
```typescript
import { Request, Response } from 'darkstar'
import { UserService } from '../services/UserService'

export class UserController {
  constructor(private userService: UserService) {}

  async index(req: Request, res: Response) {
    const users = await this.userService.findAll()
    return res.json(users)
  }

  async show(req: Request, res: Response) {
    const user = await this.userService.findById(req.params.id)
    return res.json(user)
  }

  async store(req: Request, res: Response) {
    const user = await this.userService.create(req.body)
    return res.status(201).json(user)
  }

  async update(req: Request, res: Response) {
    const user = await this.userService.update(req.params.id, req.body)
    return res.json(user)
  }

  async destroy(req: Request, res: Response) {
    await this.userService.delete(req.params.id)
    return res.status(204).send()
  }
}
```

**`UserService.ts`**
```typescript
import { UserRepository } from '../repositories/UserRepository'

export class UserService {
  constructor(private userRepository: UserRepository) {}

  findAll()                        { return this.userRepository.findAll() }
  findById(id: string)             { return this.userRepository.findById(id) }
  create(data: any)                { return this.userRepository.create(data) }
  update(id: string, data: any)    { return this.userRepository.update(id, data) }
  delete(id: string)               { return this.userRepository.delete(id) }
}
```

**Rotas geradas automaticamente:**
```
GET    /users
GET    /users/:id
POST   /users
PUT    /users/:id
DELETE /users/:id
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
- **Constellation CLI** — projeto anterior do autor, mesmo espírito de automatizar o que é repetitivo

---

> Construído por [Sidnei Junior](https://github.com/SidneiAJr) · Open Source
