/// <reference types="jest" />
import {db} from '@app/shared/sqlite/sqlite'

export type SqliteMockRow = Record<string, unknown>

export type QueuedStatement = {
  sql: string
  params: unknown[]
  onSuccess?: (tx: {executeSql: jest.Mock}, result: unknown) => void
  onError?: (tx: {executeSql: jest.Mock}, err: Error) => boolean
}

export type InMemorySqliteInitialState = {
  tableName?: string
  tableExists?: boolean
  userVersion?: number
  columns?: string[]
  rows?: SqliteMockRow[]
  indexes?: string[]
}

/**
 * WebSQL(react-native-sqlite-storage)의 FIFO Statement Queue 및 트랜잭션 롤백을 재현하는
 * 공통 인메모리 SQLite 테스트 시뮬레이터
 */
export function createInMemorySqliteState(
  initial?: InMemorySqliteInitialState,
) {
  const targetTable = initial?.tableName ?? 'messages'
  const state = {
    tableExists:
      initial?.tableExists ?? (initial?.columns?.length ? true : false),
    userVersion: initial?.userVersion ?? 0,
    columns: [...(initial?.columns ?? [])],
    rows: [...(initial?.rows ?? [])],
    indexes: new Set<string>(initial?.indexes ?? []),
    executedQueries: [] as string[],
  }

  let currentQueue: QueuedStatement[] = []

  const executeSql = jest.fn(
    (
      sql: string,
      params: unknown[] = [],
      onSuccess?: (tx: {executeSql: jest.Mock}, result: unknown) => void,
      onError?: (tx: {executeSql: jest.Mock}, err: Error) => boolean,
    ) => {
      currentQueue.push({sql, params, onSuccess, onError})
    },
  )

  const runStatement = (
    stmt: QueuedStatement,
    txObj: {executeSql: jest.Mock},
  ) => {
    const normalized = stmt.sql.trim()
    state.executedQueries.push(normalized)
    const {params, onSuccess, onError} = stmt

    // 0. sqlite_master 테이블 존재 여부 조회
    if (/SELECT name FROM sqlite_master WHERE type='table'/i.test(normalized)) {
      const items = state.tableExists ? [{name: targetTable}] : []
      onSuccess?.(txObj, {
        rows: {
          length: items.length,
          item: (idx: number) => items[idx],
        },
      })
      return
    }

    // 1. PRAGMA user_version 조회
    if (/^PRAGMA user_version;$/i.test(normalized)) {
      onSuccess?.(txObj, {
        rows: {
          length: 1,
          item: () => ({user_version: state.userVersion}),
        },
      })
      return
    }

    // 2. PRAGMA user_version 설정
    const setVersionMatch = normalized.match(
      /^PRAGMA user_version\s*=\s*(\d+);?$/i,
    )
    if (setVersionMatch) {
      state.userVersion = Number(setVersionMatch[1])
      onSuccess?.(txObj, {rows: {length: 0, item: () => undefined}})
      return
    }

    // 3. PRAGMA table_info 조회
    if (/^PRAGMA table_info\(\w+\);?$/i.test(normalized)) {
      const items = state.columns.map(name => ({name}))
      onSuccess?.(txObj, {
        rows: {
          length: items.length,
          item: (idx: number) => items[idx],
        },
      })
      return
    }

    // 3-1. PRAGMA index_list 조회
    if (/^PRAGMA index_list\(\w+\);?$/i.test(normalized)) {
      const items = Array.from(state.indexes).map(name => ({name}))
      onSuccess?.(txObj, {
        rows: {
          length: items.length,
          item: (idx: number) => items[idx],
        },
      })
      return
    }

    // 4. CREATE TABLE IF NOT EXISTS ...
    if (/^CREATE TABLE IF NOT EXISTS\s+\w+/i.test(normalized)) {
      const bodyMatch = normalized.match(/\(([\s\S]*)\)/)
      if (bodyMatch) {
        const colNames = bodyMatch[1]
          .split(',')
          .map(line => line.trim().split(/\s+/)[0])
          .filter(Boolean)
        state.columns = colNames
        state.tableExists = true
      }
      onSuccess?.(txObj, {rows: {length: 0, item: () => undefined}})
      return
    }

    // 5. ALTER TABLE <tableName> ADD COLUMN <colName> <type> [DEFAULT <val>]
    const alterMatch = normalized.match(
      /^ALTER TABLE\s+\w+\s+ADD COLUMN\s+(\w+)\s+([^;]+);?$/i,
    )
    if (alterMatch) {
      const colName = alterMatch[1]
      const colSpec = alterMatch[2]
      if (!state.columns.includes(colName)) {
        state.columns.push(colName)
      }

      let defaultValue: unknown = null
      const defaultMatch = colSpec.match(/DEFAULT\s+('([^']*)'|(\d+))/i)
      if (defaultMatch) {
        defaultValue =
          defaultMatch[2] !== undefined
            ? defaultMatch[2]
            : Number(defaultMatch[3])
      }

      state.rows = state.rows.map(row => ({
        ...row,
        [colName]: row[colName] !== undefined ? row[colName] : defaultValue,
      }))

      onSuccess?.(txObj, {rows: {length: 0, item: () => undefined}})
      return
    }

    // 6. CREATE INDEX IF NOT EXISTS <indexName> ON <tableName> (<cols>)
    const indexMatch = normalized.match(
      /^CREATE INDEX IF NOT EXISTS\s+(\w+)\s+ON\s+\w+\s*\(([^)]+)\)/i,
    )
    if (indexMatch) {
      const indexName = indexMatch[1]
      const indexCols = indexMatch[2]
        .split(',')
        .map(c => c.trim().split(/\s+/)[0])

      for (const col of indexCols) {
        if (!state.columns.includes(col)) {
          const err = new Error(`no such column: ${col}`)
          onError?.(txObj, err)
          throw err
        }
      }

      state.indexes.add(indexName)
      onSuccess?.(txObj, {rows: {length: 0, item: () => undefined}})
      return
    }

    // 7. INSERT [OR REPLACE] INTO <tableName> (<cols>) VALUES (...)
    const insertMatch = normalized.match(
      /^INSERT(?:\s+OR\s+REPLACE)?\s+INTO\s+\w+\s*\(([^)]+)\)\s*VALUES/i,
    )
    if (insertMatch) {
      const insertCols = insertMatch[1]
        .split(',')
        .map(c => c.trim())
        .filter(Boolean)
      const row: SqliteMockRow = {}
      insertCols.forEach((col, idx) => {
        row[col] = params[idx]
      })
      const existingIdx = state.rows.findIndex(r => r.id === row.id)
      if (existingIdx >= 0) {
        state.rows[existingIdx] = row
      } else {
        state.rows.push(row)
      }
      onSuccess?.(txObj, {
        rowsAffected: 1,
        rows: {length: 0, item: () => undefined},
      })
      return
    }

    // 8. SELECT * FROM <tableName> WHERE roomId = ? [AND seq < ?] ORDER BY seq DESC LIMIT ?
    if (
      /^SELECT \* FROM \w+ WHERE roomId = \?.*ORDER BY seq DESC LIMIT \?$/i.test(
        normalized,
      )
    ) {
      const hasCursor = /AND seq < \?/i.test(normalized)
      const roomId = params[0] as string
      const cursorSeq = hasCursor ? (params[1] as number) : undefined
      const limit = (hasCursor ? params[2] : params[1]) as number

      const filtered = state.rows
        .filter(r => r.roomId === roomId)
        .filter(r =>
          cursorSeq !== undefined ? Number(r.seq ?? 0) < cursorSeq : true,
        )
        .sort((a, b) => Number(b.seq ?? 0) - Number(a.seq ?? 0))
        .slice(0, limit)
        .map(r => ({...r}))

      onSuccess?.(txObj, {
        rows: {
          length: filtered.length,
          item: (idx: number) => filtered[idx],
        },
      })
      return
    }

    // 9. SELECT * FROM <tableName> WHERE roomId = ? AND id = ? LIMIT 1
    if (
      /^SELECT \* FROM \w+ WHERE roomId = \? AND id = \? LIMIT 1$/i.test(
        normalized,
      )
    ) {
      const [roomId, messageId] = params as [string, string]
      const found = state.rows.find(
        r => r.roomId === roomId && r.id === messageId,
      )
      const resultRows = found ? [{...found}] : []
      onSuccess?.(txObj, {
        rows: {
          length: resultRows.length,
          item: (idx: number) => resultRows[idx],
        },
      })
      return
    }

    onSuccess?.(txObj, {rows: {length: 0, item: () => undefined}})
  }

  ;(db.transaction as jest.Mock).mockImplementation(
    (
      txCallback: (tx: {executeSql: typeof executeSql}) => void,
      errorCallback?: (err: Error) => void,
      successCallback?: () => void,
    ) => {
      const snapshot = {
        tableExists: state.tableExists,
        userVersion: state.userVersion,
        columns: [...state.columns],
        rows: state.rows.map(r => ({...r})),
        indexes: new Set(state.indexes),
      }

      const txQueue: QueuedStatement[] = []
      currentQueue = txQueue
      const txObj = {executeSql}

      try {
        txCallback(txObj)
        while (txQueue.length > 0) {
          const stmt = txQueue.shift()!
          currentQueue = txQueue
          runStatement(stmt, txObj)
        }
        successCallback?.()
      } catch (err) {
        state.tableExists = snapshot.tableExists
        state.userVersion = snapshot.userVersion
        state.columns = snapshot.columns
        state.rows = snapshot.rows
        state.indexes = snapshot.indexes
        errorCallback?.(err as Error)
      }
    },
  )

  return {state, executeSql}
}

