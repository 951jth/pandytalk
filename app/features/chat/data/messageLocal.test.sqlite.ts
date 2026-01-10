import {
  CREATE_MESSAGE_TABLE_V1_SQL,
  CREATE_MESSAGE_TABLE_V2_SQL,
  MESSAGE_COLUMNS_V1,
  MESSAGE_COLUMNS_V2,
  MESSAGE_TABLE,
} from '@app/features/chat/data/messages.schema'
import {db, makeInsertSql} from '@app/shared/sqlite/sqlite'
import {sqliteCall} from '@app/shared/sqlite/sqliteCall'
import type {Transaction} from 'react-native-sqlite-storage'

export type TargetOldVersion = 1 | 2

export const messageLocalTest = {
  //마이그레이션 강제로 버전 낮추기(테스트용)
  forceSetUserVersion: (version: TargetOldVersion) => {
    return sqliteCall('messageLocal.forceSetUserVersion', () => {
      return new Promise<void>((resolve, reject) => {
        db.transaction((tx: Transaction) => {
          tx.executeSql(
            `PRAGMA user_version = ${version};`,
            [],
            () => resolve(),
            (_: any, err: any) => (reject(err), true),
          )
        })
      })
    })
  },
  //테스트용 구버전 스키마로 돌리기
  async resetMessagesToOldSchema(oldVersion: TargetOldVersion) {
    return sqliteCall('messageLocal.resetMessagesToOldSchema', async () => {
      const insertV1Sql = makeInsertSql(MESSAGE_TABLE, MESSAGE_COLUMNS_V1)
      const insertV2Sql = makeInsertSql(MESSAGE_TABLE, MESSAGE_COLUMNS_V2)
      return new Promise<void>((resolve, reject) => {
        const now = Date.now()

        const onSqlError = (tx: any, err: any) => {
          reject(err)
          console.log(tx?.message)
          return true
        }

        db.transaction(
          tx => {
            // ✅ WebSQL 안전 패턴: transaction 콜백 안에서 SQL을 "동기적으로" 전부 등록(enqueue)

            // 1) DROP
            tx.executeSql(
              `DROP TABLE IF EXISTS ${MESSAGE_TABLE};`,
              [],
              undefined,
              onSqlError,
            )

            if (oldVersion === 1) {
              // 2) CREATE v1
              tx.executeSql(
                CREATE_MESSAGE_TABLE_V1_SQL,
                [],
                undefined,
                onSqlError,
              )

              // 3) user_version = 1
              tx.executeSql(
                `PRAGMA user_version = 1;`,
                [],
                undefined,
                onSqlError,
              )

              // 4) INSERT dummy (이게 마지막)
              tx.executeSql(
                insertV1Sql,
                [
                  'm_v1_1', // id
                  'r1', // roomId
                  'hello v1', // text
                  'u1', // senderId
                  now, // createdAt
                  'text', // type
                  null, // imageUrl
                  null, // senderPicURL
                  'tester', // senderName
                ],
                () => resolve(),
                onSqlError,
              )

              return
            }

            if (oldVersion === 2) {
              // 2) CREATE v2
              tx.executeSql(
                CREATE_MESSAGE_TABLE_V2_SQL,
                [],
                undefined,
                onSqlError,
              )

              // 3) user_version = 2
              tx.executeSql(
                `PRAGMA user_version = 2;`,
                [],
                undefined,
                onSqlError,
              )

              // 4) INSERT dummy (이게 마지막)
              tx.executeSql(
                insertV2Sql,
                [
                  'm_v2_1', // id
                  'r1', // roomId
                  'hello v2', // text
                  'u1', // senderId
                  now, // createdAt
                  'image', // type
                  'https://img', // imageUrl
                  null, // senderPicURL
                  'tester', // senderName
                  10, // seq
                ],
                () => resolve(),
                onSqlError,
              )

              return
            }

            reject(new Error(`Unsupported oldVersion: ${oldVersion}`))
          },
          e => reject(e),
        )
      })
    })
  },
}
