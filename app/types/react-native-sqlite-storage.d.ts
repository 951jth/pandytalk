declare module 'react-native-sqlite-storage' {
  export interface SQLError {
    code: number
    message: string
  }

  export interface ResultSet {
    rows: {
      length: number
      item: (index: number) => any
      _array: any[]
    }
    rowsAffected: number
    insertId?: number
  }

  export interface Transaction {
    executeSql: (
      sqlStatement: string,
      args?: any[],
      callback?: (tx: Transaction, resultSet: ResultSet) => void,
      errorCallback?: (tx: Transaction, error: SQLError) => void,
    ) => void
  }

  export interface SQLiteDatabase {
    transaction: (
      callback: (tx: Transaction) => void,
      errorCallback?: (error: SQLError) => void,
      successCallback?: () => void,
    ) => void

    close: () => void
  }

  const SQLite: {
    openDatabase: (
      config:
        | string
        | {
            name: string
            location: 'default' | string
            createFromLocation?: number | string
          },
      successCallback?: () => void,
      errorCallback?: (error: SQLError) => void,
    ) => SQLiteDatabase
  }

  export default SQLite
}
