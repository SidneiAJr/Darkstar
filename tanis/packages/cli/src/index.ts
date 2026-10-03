#!/usr/bin/env node

import { program } from 'commander'
import { runNew }         from './commands/new'
import { runServe }       from './commands/serve'
import { makeController } from './commands/artisan/make-controller'
import { makeService }    from './commands/artisan/make-service'
import { makeRepository } from './commands/artisan/make-repository'
import { makeModel }      from './commands/artisan/make-model'
import { makeApi }        from './commands/artisan/make-api'
import { dbMigrate }      from './commands/artisan/db-migrate'
import { dbSeed }         from './commands/artisan/db-seed'
import { makeMigration } from './commands/artisan/make-migration'
import { dbCreate } from './commands/artisan/db-create'
import { dbRollback } from './commands/artisan/db-rollback'

// -----------------------------------------------
// Configuração do programa
// -----------------------------------------------

program
  .name('tanis')
  .description('Tanis — Backend Framework for Node.js')
  .version('1.0.0')

// -----------------------------------------------
// tanis new <name>
// -----------------------------------------------

program
  .command('new <name>')
  .description('Cria um novo projeto Tanis')
  .action((name: string) => runNew(name))

// -----------------------------------------------
// tanis serve
// -----------------------------------------------

program
  .command('serve')
  .description('Sobe o servidor de desenvolvimento')
  .action(() => runServe())

// -----------------------------------------------
// tanis artisan
// -----------------------------------------------

const artisan = program
  .command('artisan')
  .description('Tanis Artisan — gerador de arquivos e banco de dados')

artisan
  .command('make:controller <name>')
  .description('Cria um Controller')
  .action((name: string) => makeController(name))

artisan
  .command('make:service <name>')
  .description('Cria um Service')
  .action((name: string) => makeService(name))

artisan
  .command('make:repository <name>')
  .description('Cria um Repository')
  .action((name: string) => makeRepository(name))

artisan
  .command('make:model <name>')
  .description('Cria um Model')
  .action((name: string) => makeModel(name))

artisan
  .command('make:api <name>')
  .description('Gera Controller + Service + Repository + Model + Rotas')
  .action((name: string) => makeApi(name))

artisan
  .command('db:migrate')
  .description('Roda as migrations pendentes')
  .action(() => dbMigrate())

artisan
  .command('db:seed')
  .description('Popula o banco com seeders')
  .action(() => dbSeed())

artisan
  .command('make:migration <name>')
  .description('Cria uma nova migration')
  .action((name: string) => makeMigration(name))

artisan
  .command('db:create')
  .description('Cria o banco de dados')
  .action(() => dbCreate())

artisan
  .command('db:rollback')
  .description('Desfaz a última migration')
  .action(() => dbRollback())

program.parse(process.argv)