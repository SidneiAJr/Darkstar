import { Seeder } from './Seeder.ts'

export class DatabaseSeeder {
  private seeders: Seeder[] = [
    // registre seus seeders aqui
    // ex: new UserSeeder(),
  ]

  async run() {
    for (const seeder of this.seeders) {
      await seeder.run()
    }
  }
}