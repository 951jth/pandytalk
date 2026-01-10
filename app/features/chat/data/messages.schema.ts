import {
  buildColumnsArray,
  makeCreateTableSql,
  type ColumnDef,
} from '@app/shared/sqlite/sqlite'
import type {Transaction} from 'react-native-sqlite-storage'

export const MESSAGE_TABLE = 'messages' as const

// 🔥🔥TODO: 테이블 버전이 업될때마다 확인해야함🔥🔥
//V1 테이블 (id, roomId, text, senderId, createdAt, type, imageUrl, senderPicURL, senderName)
const V1_COLUMNS: ColumnDef[] = [
  {name: 'id', sql: 'id TEXT PRIMARY KEY'},
  {name: 'roomId', sql: 'roomId TEXT NOT NULL'},
  {name: 'text', sql: 'text TEXT'},
  {name: 'senderId', sql: 'senderId TEXT NOT NULL'},
  {name: 'createdAt', sql: 'createdAt INTEGER NOT NULL'},
  {name: 'type', sql: 'type TEXT NOT NULL'},
  {name: 'imageUrl', sql: 'imageUrl TEXT'},
  {name: 'senderPicURL', sql: 'senderPicURL TEXT'},
  {name: 'senderName', sql: 'senderName TEXT'},
]
//V2 테이블 (seq 추가)
const V2_COLUMNS: ColumnDef[] = [
  ...V1_COLUMNS,
  {name: 'seq', sql: 'seq INTEGER DEFAULT 0'},
]
//V3 테이블 (status 추가)
const V3_COLUMNS: ColumnDef[] = [
  ...V2_COLUMNS,
  {name: 'status', sql: "status TEXT DEFAULT 'success'"},
]

// 🔥🔥TODO: 테이블 버전이 업될때마다 확인해야함🔥🔥
//V1 테이블 (id, roomId, text, senderId, createdAt, type, imageUrl, senderPicURL, senderName)
export const CREATE_MESSAGE_TABLE_V1_SQL = makeCreateTableSql(
  MESSAGE_TABLE,
  V1_COLUMNS,
)
export const MESSAGE_COLUMNS_V1 = buildColumnsArray(V1_COLUMNS)

//V2 테이블 (seq 추가)
export const CREATE_MESSAGE_TABLE_V2_SQL = makeCreateTableSql(
  MESSAGE_TABLE,
  V2_COLUMNS,
)
export const MESSAGE_COLUMNS_V2 = buildColumnsArray(V2_COLUMNS)

//V3 테이블 (status 추가)
export const CREATE_MESSAGE_TABLE_V3_SQL = makeCreateTableSql(
  MESSAGE_TABLE,
  V3_COLUMNS,
)
export const MESSAGE_COLUMNS_V3 = buildColumnsArray(V3_COLUMNS)

// 🔥🔥TODO: 버전업될떄마다 확인🔥🔥
// 최신 버전: 예) v2까지 존재한다면 2
type Migration = (tx: Transaction) => void
// ✅ key는 "업데이트 후 버전"으로 통일 (1,2,3...)
export const migrations: Record<number, Migration> = {
  // v0 -> v1 : messages 테이블/인덱스 생성 (예: 초기 스키마)
  1: tx => {
    tx.executeSql(CREATE_MESSAGE_TABLE_V1_SQL)
    tx.executeSql(
      `CREATE INDEX IF NOT EXISTS idx_messages_room_created ON messages (roomId, createdAt DESC);`,
    )
  },

  // v1 -> v2 : seq 컬럼 추가
  2: tx => {
    tx.executeSql(`ALTER TABLE messages ADD COLUMN seq INTEGER DEFAULT 0;`)
    tx.executeSql(
      `CREATE INDEX IF NOT EXISTS idx_messages_room_seq ON messages (roomId, seq DESC);`,
    )
  },
  //v2 -> v3 : status 컬럼 추가
  3: tx => {
    // 뒤에 DEFAULT 'success' 추가!
    tx.executeSql(
      `ALTER TABLE messages ADD COLUMN status TEXT DEFAULT 'success';`,
    )
  },
}

//🔥🔥TODO: 중요 가장 최근 컬럼값으로 설정해야함 (초기화 할떄 사용함)🔥🔥
export const MESSAGE_PLACEHOLDERS = MESSAGE_COLUMNS_V3.map(() => '?').join(', ')
export const MESSAGE_COLUMN_SQL = MESSAGE_COLUMNS_V3.join(', ')
export const LATEST_DB_VERSION = 3
export const CREATE_MESSAGE_TABLE_RECENT_SQL = CREATE_MESSAGE_TABLE_V3_SQL
