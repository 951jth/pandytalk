import {
  CREATE_MESSAGE_TABLE_RECENT_SQL,
  LATEST_DB_VERSION,
  migrations,
} from '@app/features/chat/data/messages.schema'
import {db} from '@app/shared/sqlite/sqlite'
import {sqliteCall} from '@app/shared/sqlite/sqliteCall'
import type {Transaction} from 'react-native-sqlite-storage'

export const messageMigrate = {
  migrateDatabaseIfNeeded: async (): Promise<void> => {
    return sqliteCall('messageLocal.migrateDatabaseIfNeeded', () => {
      return new Promise((resolve, reject) => {
        db.transaction(
          (tx: Transaction) => {
            tx.executeSql('PRAGMA user_version;', [], (_, {rows}) => {
              const currentVersion = rows.item(0).user_version ?? 0
              console.log('📘 Current DB version:', currentVersion)

              let nextVersion = currentVersion + 1 // 🔥 여기서 +1부터 시작

              while (nextVersion <= LATEST_DB_VERSION) {
                // 🔥 조건 수정
                const migrate = migrations[nextVersion] // 다음 버전을 가져옴

                if (migrate) {
                  console.log(`🚀 Migrating to version ${nextVersion}...`)
                  migrate(tx)
                } else {
                  console.warn(`⚠️ No migration found for v${nextVersion}`)
                }

                nextVersion++
              }

              // 최종 버전 업데이트
              if (nextVersion > currentVersion + 1) {
                // 마지막에 한 번만 실행해도 됨
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
    })
  },
  initMessageTable: () => {
    return sqliteCall('messageLocal.initMessageTable', async () => {
      await new Promise<void>((resolve, reject) => {
        db.transaction(
          (tx: Transaction) => {
            tx.executeSql(
              CREATE_MESSAGE_TABLE_RECENT_SQL,
              [],
              () => {
                // 2) ✅ 신규 설치 케이스에서 버전도 최신으로 세팅
                tx.executeSql(
                  `PRAGMA user_version = ${LATEST_DB_VERSION};`,

                  [],
                  () => {
                    if (__DEV__)
                      console.log(
                        `✅ messages table ready (v${LATEST_DB_VERSION})`,
                      )
                  },
                  (_tx, error) => {
                    if (__DEV__)
                      console.error('❌ Failed to set user_version', error)
                    reject(error)
                    return true
                  },
                )
              },
              (_tx, error) => {
                if (__DEV__)
                  console.error('❌ Failed to create messages table', error)
                reject(error)
                return true
              },
            )
          },
          // ✅ 트랜잭션 레벨 에러도 잡아서 reject
          error => reject(error),
          // ✅ 트랜잭션 완료 보장
          () => resolve(),
        )
      })
    })
  },
  getUserVersion: () => {
    return sqliteCall<number>('messageLocal.getUserVersion', () => {
      return new Promise<number>((resolve, reject) => {
        db.transaction((tx: Transaction) => {
          tx.executeSql(
            'PRAGMA user_version;',
            [],
            (_: any, res: any) =>
              resolve(res.rows.item(0).user_version as number),
            (_: any, err: any) => (reject(err), true),
          )
        })
      })
    })
  },
}
