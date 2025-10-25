import type {Transaction} from 'react-native-sqlite-storage'
import {db} from '../store/sqlite'
// 현재 앱에서 사용하는 최신 DB 버전
const LATEST_DB_VERSION = 1

// ✅ 버전별 마이그레이션 로직
const migrations: Record<number, (tx: Transaction) => void> = {
  // v1 → v2 : seq 컬럼 추가
  1: tx => {
    tx.executeSql('PRAGMA table_info(messages);', [], (_, {rows}) => {
      const hasSeq = rows._array.some(r => r.name === 'seq')
      if (!hasSeq) {
        tx.executeSql('ALTER TABLE messages ADD COLUMN seq INTEGER DEFAULT 0;')
      } else {
        console.log('✅ seq column already exists — skipping ALTER TABLE.')
      }
    })
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
