// -----------------------------------------------
// BaseDriver — contrato que todo driver implementa
// -----------------------------------------------

export interface QueryResult<T = any> {
  rows: T[]
  affectedRows: number
  insertId?: number | string
}

export interface BaseDriver {
  // Conecta ao banco
  connect(): Promise<void>

  // Fecha a conexão
  disconnect(): Promise<void>

  // Executa uma query crua com bindings
  query<T = any>(sql: string, bindings?: any[]): Promise<QueryResult<T>>

  // Verifica se está conectado
  ping(): Promise<boolean>

  // Retorna o tipo do banco
  type(): 'sqlite' | 'mysql' | 'mariadb' | 'postgres'

  // Retorna uma conexão do pool (opcional — MySQL/MariaDB)
  getConnection?(): Promise<any>

  // Libera uma conexão de volta pro pool (opcional — MySQL/MariaDB)
  releaseConnection?(conn: any): Promise<void>
}