import {
  CREATE_MESSAGE_TABLE_RECENT_SQL,
  LATEST_DB_VERSION,
  MESSAGE_TABLE,
  MESSAGES_COLUMNS,
  migrations,
} from '@app/features/chat/data/messages.schema'
import {logger} from '@app/shared/services/logger'
import {db} from '@app/shared/sqlite/sqlite'
import {sqliteCall} from '@app/shared/sqlite/sqliteCall'
import type {
  ResultSet,
  SQLError,
  Transaction,
} from 'react-native-sqlite-storage'

type UserVersionRow = {
  user_version?: number
}

type TableInfoRow = {
  name?: string
}

export const messageMigrateLocal = {
  isMessagesTableExists: () => {
    return sqliteCall('messageLocal.isMessagesTableExists', async () => {
      return new Promise((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            'SELECT name FROM sqlite_master WHERE type=\'table\' AND name=\'messages\';',
            [],
            (_, result) => {
              const exists = result.rows.length > 0
              resolve(exists)
            },
            (_, error) => {
              logger.error('isMessagesTableExists check failed', error)
              reject(error)
              return true
            },
          )
        })
      })
    })
  },
  migrateDatabaseIfNeeded: async (): Promise<void> => {
    return sqliteCall(
      'messageLocal.migrateDatabaseIfNeeded',
      () => {
        return new Promise((resolve, reject) => {
          db.transaction(
            (tx: Transaction) => {
              tx.executeSql('PRAGMA user_version;', [], (_, {rows}) => {
                const currentVersion = rows.item(0).user_version ?? 0
                logger.info(`📘 Current DB version: ${currentVersion}`)
                let nextVersion = currentVersion + 1 // 🔥 여기서 +1부터 시작
                while (nextVersion <= LATEST_DB_VERSION) {
                  const migrate = migrations[nextVersion]

                  if (migrate) {
                    logger.info(
                      `🚀 [Migration] Version ${nextVersion - 1} -> ${nextVersion} 시작...`,
                    )
                    migrate(tx)
                  } else {
                    logger.warn(
                      `⚠️ [Migration] v${nextVersion}에 대한 정의를 찾을 수 없습니다.`,
                    )
                  }

                  nextVersion++
                }
                // 최종 버전 업데이트
                if (nextVersion > currentVersion + 1) {
                  tx.executeSql(
                    `PRAGMA user_version = ${LATEST_DB_VERSION};`,
                    [],
                    () => {
                      logger.info(
                        `✅ [Migration] DB updated to version ${LATEST_DB_VERSION}`,
                      )
                    },
                  )
                } else {
                  logger.info('✅ [Migration] DB already up to date.')
                }
              })
            },
            err => {
              logger.error('❌ Migration transaction failed', err)
              reject(err)
            },
            () => resolve(),
          )
        })
      },
      {lock: true},
    )
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
                    logger.info(`✅ messages table ready (v${LATEST_DB_VERSION})`)
                  },
                  (_tx, error) => {
                    logger.error('❌ Failed to set user_version', error)
                    reject(error)
                    return true
                  },
                )
              },
              (_tx, error) => {
                logger.error('❌ Failed to create messages table', error)
                reject(error)
                return true
              },
            )
          },
          // ✅ 트랜잭션 레벨 에러도 잡아서 reject
          error => reject(error),
          // 트랜잭션 완료 callback에서 Promise를 resolve
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
            (_tx: Transaction, res: ResultSet) => {
              const row = res.rows.item(0) as UserVersionRow
              resolve(row.user_version ?? 0)
            },
            (_tx: Transaction, err: SQLError) => {
              reject(err)
              return true
            },
          )
        })
      })
    })
  },
  // 누락 컬럼은 ALTER로도 고칠 수 있지만,
  // 부분적으로만 고쳐져서 재발하는 케이스가 많았음.
  getMissingColumns: () => {
    return sqliteCall('messageLocal.getMissingColumns', () => {
      return new Promise<string[]>((resolve, reject) => {
        db.transaction((tx: Transaction) => {
          tx.executeSql(
            `PRAGMA table_info(${MESSAGE_TABLE});`,
            [],
            (_tx: Transaction, res: ResultSet) => {
              try {
                // 1) 현재 테이블 컬럼명 Set 만들기
                const currentColumns = new Set<string>()
                for (let i = 0; i < res.rows.length; i++) {
                  const row = res.rows.item(i) as TableInfoRow
                  if (row?.name) currentColumns.add(String(row.name))
                }

                // 2) expectedColumns와 비교해서 missing count 계산
                const missingColumns = MESSAGES_COLUMNS.reduce(
                  (acc, colName) => {
                    const has = currentColumns.has(colName)
                    if (!has) acc.add(colName)
                    return acc
                  },
                  new Set<string>(),
                )
                resolve(Array.from(missingColumns) ?? [])
              } catch (e) {
                reject(e)
              }
            },
            (_tx: Transaction, err: SQLError) => {
              reject(err)
              return true
            },
          )
        })
      })
    })
  },
  //테이블을 삭제 후 재생성 (최종 수단)
  rebuildMessageTable: async () => {
    return sqliteCall(
      'messageMigrateService.rebuildMessageTable',
      () =>
        new Promise<void>((resolve, reject) => {
          db.transaction(
            (tx: Transaction) => {
              tx.executeSql(`DROP TABLE IF EXISTS ${MESSAGE_TABLE};`)
              tx.executeSql(CREATE_MESSAGE_TABLE_RECENT_SQL)
            },
            reject,
            resolve,
          )
        }),
      {lock: true}, //sqlite 요청이 직렬로 처리되어야함(테이블 스키마가 변경될 수 있기 떄문.)
    )
  },
}
