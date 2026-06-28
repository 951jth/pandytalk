import SQLite, {ResultSet, SQLError, Transaction} from 'react-native-sqlite-storage'

export const db = SQLite.openDatabase(
  {
    name: 'chat.db',
    location: 'default',
  },
  () => {
    console.log('Database opened successfully')
  },
  (error: SQLError) => {
    console.log('Error opening database', error)
  },
)



export type ColumnDef = {
  name: string
  sql: string // "colName TYPE ..." 형태(컬럼명 포함)
}

export const execSql = (tx: Transaction, sql: string, params: unknown[] = []) =>
  new Promise<void>((resolve, reject) => {
    tx.executeSql(
      sql,
      params,
      () => resolve(),
      (_tx, err) => {
        reject(err)
        return true
      },
    )
  })

export const getUserVersionTx = (tx: Transaction) =>
  new Promise<number>((resolve, reject) => {
    tx.executeSql(
      'PRAGMA user_version;',
      [],
      (_tx, res) => resolve(res.rows.item(0).user_version as number),
      (_tx, err) => {
        reject(err)
        return true
      },
    )
  })

export const setUserVersionTx = (tx: Transaction, version: number) =>
  execSql(tx, `PRAGMA user_version = ${version};`)

// tx.executeSql 콜백 체인 유틸 (가독성용)
export const run = (tx: Transaction, sql: string, params: unknown[] = []) =>
  new Promise<ResultSet>((res, rej) => {
    tx.executeSql(
      sql,
      params,
      (_tx, result) => res(result),
      (_tx, err) => {
        rej(err)
        return true
      },
    )
  })

export const makeInsertSql = (table: string, columns: string[]) => {
  const cols = columns.join(', ')
  const placeholders = columns.map(() => '?').join(', ')
  return `INSERT INTO ${table} (${cols}) VALUES (${placeholders});`
}

export const makeCreateTableSql = (table: string, cols: ColumnDef[]) => {
  const body = cols.map(c => `  ${c.sql}`).join(',\n')
  return `CREATE TABLE IF NOT EXISTS ${table} (\n${body}\n);`
}

export const buildColumnsArray = (colDef: ColumnDef[]) => {
  return colDef?.map(col => col?.name) as string[]
}
