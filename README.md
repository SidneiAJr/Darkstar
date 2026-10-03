> [!WARNING]
> 🚧 O Darkstar está em desenvolvimento ativo. Não use em produção — APIs podem mudar sem aviso.


# 🪐 Darkstar  — Backend Framework for Node.js

> *"O lar da humanidade. O lar do dev."*
> Inspirado no planeta Tanis do filme **Pandorum** — e na elegância do **Laravel**.

---

## Por que o Darkstar existe?

Sou fã de PHP. Primeira vez que vi o Laravel bati a cabeça e não entendi nada — mas quando entendi, pensei: *"isso é brilhante"*.

O NestJS tenta trazer essa experiência pro Node, mas na prática é verboso, cheio de decoradores e difícil de ler. O Express puro é flexível demais — você acaba construindo a mesma estrutura do zero em todo projeto.

O **Tanis** nasceu pra resolver isso: um framework Node.js com a clareza e produtividade do Laravel, sem a bagunça do ecossistema.

---

## Filosofia

- **Convenção sobre configuração** — estrutura pronta, sem decisão desnecessária
- **MVC como cidadão de primeira classe** — Controller → Service → Repository é o padrão, não uma opinião
- **CLI que faz o trabalho pesado** — uma linha de comando gera toda a camada
- **Dependências centralizadas** — você atualiza o Tanis, não 40 pacotes separados
- **ORM expressivo** — query builder fluido estilo Eloquent, não decoradores

---

## Instalação

```bash
npm install -g tanis-cli
```

---

## Criando um projeto

```bash
tanis new meu-projeto
```

O CLI vai perguntar:
- Qual banco de dados? (MySQL · PostgreSQL · SQLite)
- Qual ORM? (Tanis ORM · TypeORM · Prisma)
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
├── tanis.config.ts
└── package.json
```

---

## CLI — Tanis Artisan

### Subir o servidor

```bash
tanis serve
```

### Gerar arquivos

```bash
tanis artisan make:controller User   # cria UserController com métodos básicos
tanis artisan make:model User        # cria User model + migration
tanis artisan make:service User      # cria UserService
tanis artisan make:repository User   # cria UserRepository
tanis artisan make:api User          # gera controller + service + repository + rotas CRUD completas
```

### Banco de dados

```bash
tanis artisan db:migrate             # roda as migrations pendentes
tanis artisan db:rollback            # desfaz a última migration
tanis artisan db:seed                # popula o banco com seeders
```

---

## Estrutura gerada pelo `make:api`

Um único comando `tanis artisan make:api User` gera toda a cadeia MVC:

**`UserController.ts`**
```typescript
import { Request, Response } from 'tanis'
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

  findAll()             { return this.userRepository.findAll() }
  findById(id: string)  { return this.userRepository.findById(id) }
  create(data: any)     { return this.userRepository.create(data) }
  update(id: string, data: any) { return this.userRepository.update(id, data) }
  delete(id: string)    { return this.userRepository.delete(id) }
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
- **Pandorum** — pelo nome e pela ideia de um novo lar
- **Constellation CLI** — projeto anterior do autor, mesmo espírito de automatizar o que é repetitivo

---

> Construído por [Sidnei Junior](https://github.com/SidneiAJr) · Open Source
