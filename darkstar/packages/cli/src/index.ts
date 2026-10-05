#!/usr/bin/env node

import { program } from 'commander'
import { runNew }          from './commands/new'
import { runServe }        from './commands/serve'
import { makeController }  from './commands/forge/make-controller'
import { makeService }     from './commands/forge/make-service'
import { makeRepository }  from './commands/forge/make-repository'
import { makeModel }       from './commands/forge/make-model'
import { makeApi }         from './commands/forge/make-api'
import { makeMiddleware }  from './commands/forge/make-middleware'
import { makeSchema }      from './commands/forge/make-schema'
import { makeUtil }        from './commands/forge/make-util'
import { makeDeps }        from './commands/forge/make-deps'
import { makeSecurity }    from './commands/forge/make-security'
import { dbMigrate }       from './commands/forge/db-migrate'
import { dbSeed }          from './commands/forge/db-seed'
import { makeMigration }   from './commands/forge/make-migration'
import { dbCreate }        from './commands/forge/db-create'
import { dbRollback }      from './commands/forge/db-rollback'
import { makeSeeder }      from './commands/forge/make-seeder'

// -----------------------------------------------
// Configuração do programa
// -----------------------------------------------

program
  .name('darkstar')
  .description('DarkStar — Backend Framework for Node.js')
  .version('1.0.0')

// -----------------------------------------------
// darkstar new <name>
// -----------------------------------------------

program
  .command('new <name>')
  .description('Cria um novo projeto DarkStar')
  .action((name: string) => runNew(name))

// -----------------------------------------------
// darkstar serve
// -----------------------------------------------

program
  .command('serve')
  .description('Sobe o servidor de desenvolvimento')
  .action(() => runServe())

// -----------------------------------------------
// darkstar forge
// -----------------------------------------------

const forge = program
  .command('forge')
  .description('DarkStar Forge — gerador de arquivos e banco de dados')

forge
  .command('make:controller <name>')
  .description('Cria um Controller')
  .action((name: string) => makeController(name))

forge
  .command('make:service <name>')
  .description('Cria um Service')
  .action((name: string) => makeService(name))

forge
  .command('make:repository <name>')
  .description('Cria um Repository')
  .action((name: string) => makeRepository(name))

forge
  .command('make:model <name>')
  .description('Cria um Model')
  .action((name: string) => makeModel(name))

forge
  .command('make:api <name>')
  .description('Gera Controller + Service + Repository + Model + Rotas + Schema + Middleware')
  .action((name: string) => makeApi(name))

forge
  .command('make:middleware <name>')
  .description('Cria um Middleware')
  .action((name: string) => makeMiddleware(name))

forge
  .command('make:schema <name>')
  .description('Cria um Schema')
  .action((name: string) => makeSchema(name))

forge
  .command('make:util <name>')
  .description('Cria utils de omitPassword e twoFactor')
  .action((name: string) => makeUtil(name))

forge
  .command('make:migration <name>')
  .description('Cria uma nova migration')
  .action((name: string) => makeMigration(name))

forge
  .command('make:seeder <name>')
  .description('Cria um Seeder')
  .action((name: string) => makeSeeder(name))

forge
  .command('make:security')
  .description('Gera o RateLimitMiddleware com limiters prontos')
  .action(() => makeSecurity())

forge
  .command('make:deps [names...]')
  .description('Instala dependências opcionais no projeto (sem argumentos lista todas)')
  .action((names: string[]) => makeDeps(names))

forge
  .command('db:create')
  .description('Cria o banco de dados')
  .action(() => dbCreate())

forge
  .command('db:migrate')
  .description('Roda as migrations pendentes')
  .action(() => dbMigrate())

forge
  .command('db:rollback')
  .description('Desfaz a última migration')
  .action(() => dbRollback())

forge
  .command('db:seed')
  .description('Popula o banco com seeders')
  .action(() => dbSeed())

program.parse(process.argv)