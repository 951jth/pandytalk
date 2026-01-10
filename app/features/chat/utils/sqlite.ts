type Tx = {
  executeSql: (
    sql: string,
    params?: any[],
    success?: (tx: any, res: any) => void,
    error?: (tx: any, err: any) => boolean | void,
  ) => void
}
type DB = {
  transaction: (fn: (tx: Tx) => void, onError?: (e: any) => void) => void
}

export const execSql = (tx: Tx, sql: string, params: any[] = []) =>
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

export const getUserVersionTx = (tx: Tx) =>
  new Promise<number>((resolve, reject) => {
    tx.executeSql(
      `PRAGMA user_version;`,
      [],
      (_tx, res) => resolve(res.rows.item(0).user_version as number),
      (_tx, err) => {
        reject(err)
        return true
      },
    )
  })

export const setUserVersionTx = (tx: Tx, version: number) =>
  execSql(tx, `PRAGMA user_version = ${version};`)

// tx.executeSql 콜백 체인 유틸 (가독성용)
export const run = (tx: Tx, sql: string, params: any[] = []) =>
  new Promise<any>((res, rej) => {
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
