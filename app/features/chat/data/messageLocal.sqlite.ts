import {db} from '@app/shared/sqlite/sqlite'
import {sqliteCall} from '@app/shared/sqlite/sqliteCall'
import {ChatMessage} from '@app/shared/types/chat'
import {toMillisFromServerTime} from '@app/shared/utils/firebase'
import {Transaction} from 'react-native-sqlite-storage'

const MESSAGE_TABLE = 'messages' as const
const MESSAGE_COLUMNS = [
  'id',
  'roomId',
  'text',
  'senderId',
  'createdAt',
  'type',
  'imageUrl',
  'seq',
] as const

const MESSAGE_PLACEHOLDERS = MESSAGE_COLUMNS.map(() => '?').join(', ')
const MESSAGE_COLUMN_SQL = MESSAGE_COLUMNS.join(', ')

export const messageRemote = {
  saveMessagesToSQLite: (roomId: string, messages: ChatMessage[]) => {
    // 1. 디버깅 및 성능 측정을 위해 sqliteCall 래퍼 사용
    return sqliteCall('messageLocal.saveMessagesToSQLite', () => {
      return new Promise<void>((resolve, reject) => {
        db.transaction(
          (tx: Transaction) => {
            // 2. 상수를 사용하여 쿼리 문자열 조합
            const query = `INSERT OR REPLACE INTO ${MESSAGE_TABLE} (${MESSAGE_COLUMN_SQL}) VALUES (${MESSAGE_PLACEHOLDERS})`

            messages.forEach(msg => {
              // 3. 값 매핑: 컬럼 순서(MESSAGE_COLUMNS)와 정확히 일치해야 함
              const values = [
                msg.id,
                roomId,
                msg.text,
                msg.senderId,
                toMillisFromServerTime(msg.createdAt),
                msg.type,
                msg.imageUrl ?? '',
                msg.seq ?? 1,
              ]

              tx.executeSql(query, values, undefined, (_, error) => {
                console.error('SQLite 쿼리 오류:', error)
                reject(error)
                return true
              })
            })
          },
          reject, // ✅ 트랜잭션 전체 실패
          resolve, // ✅ 트랜잭션 전체 성공
        )
      })
    })
  },
}
