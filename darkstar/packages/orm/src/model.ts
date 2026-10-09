import { Connection } from './connection'
import { QueryBuilder } from './query-builder'
import type { RelationDefinition, RelationsMap } from './types'

// -----------------------------------------------
// Model base
// -----------------------------------------------

export class Model {
  static table: string = ''

  /**
   * Campos que NÃO são retornados nas respostas da API.
   * Equivalente ao `$hidden` do Laravel.
   */
  static hidden: string[] = []

  /**
   * Relações declaradas neste model.
   * Equivalente aos métodos `hasMany`, `belongsTo` do Laravel.
   */
  static relations: RelationsMap = {}

  // -----------------------------------------------
  // Query
  // -----------------------------------------------

  static query<T extends typeof Model>(this: T): QueryBuilder<InstanceType<T>> {
    const driver = Connection.get()
    return new QueryBuilder<InstanceType<T>>(driver, this.table, this)
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
  ): Promise<InstanceType<T> | null> {
    return this.query<T>().where('id', id).update(data) as Promise<InstanceType<T> | null>
  }

  static async delete<T extends typeof Model>(
    this: T,
    id: number | string
  ): Promise<number> {
    return this.query<T>().where('id', id).delete()
  }

  // -----------------------------------------------
  // Hidden fields (Laravel-style)
  // -----------------------------------------------

  /**
   * Remove campos declarados em `static hidden`.
   * Equivalente ao `$hidden` do Laravel.
   */
  static omitHidden<T extends Record<string, any>>(obj: T): T {
    const hidden = this.hidden
    if (!hidden || hidden.length === 0) return obj

    const result = { ...obj }
    for (const key of hidden) delete (result as any)[key]
    return result
  }

  // -----------------------------------------------
  // Relations
  // -----------------------------------------------

  /**
   * Retorna a definição de uma relação.
   */
  static getRelation(name: string): RelationDefinition {
    const relation = this.relations[name]
    if (!relation) {
      throw new Error(`Relação "${name}" não definida em ${this.name}.relations`)
    }
    return relation
  }

  /**
   * Eager loading — carrega uma relação pra um array de rows.
   * Usa 2 queries no total (evita N+1).
   *
   * Suporta:
   *   hasOne        → 1 pra 1
   *   hasMany       → 1 pra N
   *   belongsTo     → N pra 1
   *   belongsToMany → N pra N
   */
  static async loadRelation(rows: any[], relationName: string): Promise<void> {
    if (rows.length === 0) return

    const relation = this.getRelation(relationName)
    const RelatedModel = relation.model()

    // -----------------------------------------------
    // belongsTo — N pra 1
    // Cada row tem o FK, busca 1
    // -----------------------------------------------
    if (relation.type === 'belongsTo') {
      const fk       = relation.foreignKey ?? `${RelatedModel.name.toLowerCase()}_id`
      const ownerKey = relation.ownerKey   ?? 'id'

      const ids = [...new Set(rows.map(r => r[fk]).filter(Boolean))]
      if (ids.length === 0) {
        rows.forEach(r => { r[relationName] = null })
        return
      }

      const related = await RelatedModel.query().whereIn(ownerKey, ids).get()
      const map = new Map(related.map((r: any) => [r[ownerKey], r]))

      rows.forEach(r => { r[relationName] = map.get(r[fk]) ?? null })
      return
    }

    // -----------------------------------------------
    // hasOne / hasMany — 1 pra 1 ou 1 pra N
    // Busca N do outro lado, agrupa pelo FK
    // -----------------------------------------------
    if (relation.type === 'hasOne' || relation.type === 'hasMany') {
      const fk       = relation.foreignKey ?? `${this.name.toLowerCase()}_id`
      const localKey = relation.localKey   ?? 'id'

      const ids = [...new Set(rows.map(r => r[localKey]).filter(Boolean))]
      if (ids.length === 0) {
        rows.forEach(r => { r[relationName] = relation.type === 'hasMany' ? [] : null })
        return
      }

      const related = await RelatedModel.query().whereIn(fk, ids).get()

      const grouped = new Map<any, any[]>()
      for (const r of related) {
        const key = (r as any)[fk]
        if (!grouped.has(key)) grouped.set(key, [])
        grouped.get(key)!.push(r)
      }

      rows.forEach(r => {
        const items = grouped.get(r[localKey]) ?? []
        r[relationName] = relation.type === 'hasMany' ? items : (items[0] ?? null)
      })
      return
    }

    // -----------------------------------------------
    // belongsToMany — N pra N via pivot table
    // -----------------------------------------------
    if (relation.type === 'belongsToMany') {
      const RelatedTable = RelatedModel.table
      const pivotTable = relation.pivotTable
        ?? [this.table, RelatedTable].sort().join('_')

      const pivotForeignKey = relation.pivotForeignKey
        ?? `${this.name.toLowerCase()}_id`
      const pivotRelatedKey = relation.pivotRelatedKey
        ?? `${RelatedModel.name.toLowerCase()}_id`
      const ownerKey = relation.ownerKey ?? 'id'

      const ids = [...new Set(rows.map(r => r[ownerKey]).filter(Boolean))]
      if (ids.length === 0) {
        rows.forEach(r => { r[relationName] = [] })
        return
      }

      // Query 1 — pega os pares da pivot
      const driver = Connection.get()
      const placeholders = ids.map(() => '?').join(', ')
      const { rows: pivotRows } = await driver.query(
        `SELECT * FROM ${pivotTable} WHERE ${pivotForeignKey} IN (${placeholders})`,
        ids
      ) as { rows: any[] }

      const relatedIds = [...new Set(pivotRows.map(p => p[pivotRelatedKey]))]
      if (relatedIds.length === 0) {
        rows.forEach(r => { r[relationName] = [] })
        return
      }

      // Query 2 — pega os models relacionados
      const related = await RelatedModel.query().whereIn(ownerKey, relatedIds).get()
      const relatedMap = new Map(related.map((r: any) => [r[ownerKey], r]))

      // Agrupa em memória
      const grouped = new Map<any, any[]>()
      for (const p of pivotRows) {
        const key = p[pivotForeignKey]
        if (!grouped.has(key)) grouped.set(key, [])
        const item = relatedMap.get(p[pivotRelatedKey])
        if (item) grouped.get(key)!.push(item)
      }

      rows.forEach(r => {
        r[relationName] = grouped.get(r[ownerKey]) ?? []
      })
    }
  }

  /**
   * Carrega múltiplas relações em sequência.
   */
  static async loadRelations(rows: any[], relationNames: string[]): Promise<void> {
    for (const name of relationNames) {
      await this.loadRelation(rows, name)
    }
  }
}