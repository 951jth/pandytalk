import type {Transaction} from 'react-native-sqlite-storage'
import {db} from './sqlite'
// 최신 버전: 예) v2까지 존재한다면 2
const LATEST_DB_VERSION = 2

type Migration = (tx: Transaction) => void

// ✅ key는 "업데이트 후 버전"으로 통일 (1,2,3...)
const migrations: Record<number, Migration> = {
  // v0 -> v1 : messages 테이블/인덱스 생성 (예: 초기 스키마)
  1: tx => {
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        roomId TEXT NOT NULL,
        text TEXT,
        senderId TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        type TEXT NOT NULL,
        imageUrl TEXT,
        senderPicURL TEXT,
        senderName TEXT
      );
    `)
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
}

/**
 * DB 마이그레이션을 수행하는 메인 함수
 */
export async function migrateDatabaseIfNeeded(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx: Transaction) => {
        tx.executeSql('PRAGMA user_version;', [], (_, {rows}) => {
          const currentVersion = rows.item(0).user_version ?? 0
          console.log('📘 Current DB version:', currentVersion)

          let version = currentVersion
          while (version < LATEST_DB_VERSION) {
            const migrate = migrations[version]
            if (migrate) {
              migrate(tx)
              version++
            } else {
              // 혹시 누락된 버전이 있으면 스킵
              console.warn(`⚠️ No migration found for v${version}`)
              version++
            }
          }

          if (version > currentVersion) {
            tx.executeSql(`PRAGMA user_version = ${LATEST_DB_VERSION};`)
            console.log(`✅ DB updated to version ${LATEST_DB_VERSION}`)
          } else {
            console.log('✅ DB already up to date.')
          }
        })
      },
      err => {
        console.error('❌ Migration transaction failed:', err)
        reject(err)
      },
      () => resolve(),
    )
  })
}
