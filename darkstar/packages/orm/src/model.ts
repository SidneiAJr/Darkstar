import { Connection } from './connection'
import { QueryBuilder } from './query-builder'

// -----------------------------------------------
// Model base
// -----------------------------------------------

export class Model {
  static table: string = ''

  static query<T extends typeof Model>(this: T): QueryBuilder<InstanceType<T>> {
    const driver = Connection.get()
    return new QueryBuilder<InstanceType<T>>(driver, this.table)
  }

  static async findAll<T extends typeof Model>(this: T): Promise<InstanceType<T>[]> {
    return this.query<T>().all()
  }

  static async findById<T extends typeof Model>(
    this: T,
    id: number | string
  ): Promise<InstanceType<T> | null> {
    return this.query<T>().find(id)
  }

  static async findBy<T extends typeof Model>(
    this: T,
    column: string,
    value: any
  ): Promise<InstanceType<T>[]> {
    return this.query<T>().where(column, value).get()
  }

  static async findFirstBy<T extends typeof Model>(
    this: T,
    column: string,
    value: any
  ): Promise<InstanceType<T> | null> {
    return this.query<T>().where(column, value).first()
  }

  static async create<T extends typeof Model>(
    this: T,
    data: Partial<InstanceType<T>>
  ): Promise<InstanceType<T>> {
    return this.query<T>().create(data)
  }

  static async update<T extends typeof Model>(
    this: T,
    id: number | string,
    data: Partial<InstanceType<T>>
  ): Promise<number> {
    return this.query<T>().where('id', id).update(data)
  }

  static async delete<T extends typeof Model>(
    this: T,
    id: number | string
  ): Promise<number> {
    return this.query<T>().where('id', id).delete()
  }
}
