import type { Model } from './model'

// -----------------------------------------------
// Tipos de relação suportados
// -----------------------------------------------
//
//  hasOne        → 1 para 1  (User hasOne Profile)
//  hasMany       → 1 para N  (User hasMany Posts)
//  belongsTo     → N para 1  (Post belongsTo User)
//  belongsToMany → N para N  (Post belongsToMany Tags)
//
// -----------------------------------------------

export type RelationType = 'hasOne' | 'hasMany' | 'belongsTo' | 'belongsToMany'

export interface RelationDefinition {
  type: RelationType

  // Função que retorna a classe do model relacionado.
  // Usa função pra evitar dependência circular em import.
  model: () => typeof Model

  // hasOne / hasMany — FK no outro model aponta pra cá
  foreignKey?: string   // ex: 'user_id' (no Post)
  localKey?: string     // ex: 'id' (no User) — padrão: 'id'

  // belongsTo — FK neste model aponta pro outro
  // (usa foreignKey acima também, mas a chave de destino é o ownerKey)
  ownerKey?: string     // ex: 'id' (no User) — padrão: 'id'

  // belongsToMany — tabela pivô
  pivotTable?: string         // ex: 'post_tag'
  pivotForeignKey?: string    // ex: 'post_id'
  pivotRelatedKey?: string    // ex: 'tag_id'
}

export type RelationsMap = Record<string, RelationDefinition>