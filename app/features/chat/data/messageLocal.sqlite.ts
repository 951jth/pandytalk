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
  'status',
] as const

const MESSAGE_PLACEHOLDERS = MESSAGE_COLUMNS.map(() => '?').join(', ')
const MESSAGE_COLUMN_SQL = MESSAGE_COLUMNS.join(', ')
const CREATE_MESSAGE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  roomId TEXT NOT NULL,
  text TEXT,
  senderId TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  type TEXT NOT NULL,
  imageUrl TEXT,
  seq INTEGER NOT NULL,
  status TEXT
);
`
const LATEST_DB_VERSION = 3

export const messageLocal = {
  saveMessagesToSQLite: (roomId: string, messages: ChatMessage[]) => {
    // 1. 디버깅 및 성능 측정을 위해 sqliteCall 래퍼 사용
    return sqliteCall('messageLocal.saveMessagesToSQLite', () => {
      return new Promise<void>((resolve, reject) => {
        db.transaction(
          (tx: Transaction) => {
            // 2. 상수를 사용하여 쿼리 문자열 조합
            const query = `INSERT OR REPLACE INTO ${MESSAGE_TABLE} (${MESSAGE_COLUMN_SQL}) VALUES (${MESSAGE_PLACEHOLDERS})`
            console.log('query', query)
            messages.forEach(msg => {
              console.log('Inserting message into SQLite:', msg)
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
                msg.status ?? 'success',
              ]
              console.log('values', values)
              tx.executeSql(query, values, undefined, (_, error) => {
                console.log(_)
                console.error('SQLite 쿼리 오류:', error)
                reject(error)
                return true
              })
            })
          },
          reject, // ✅ 트랜잭션 전체 실패
          resolve,
        )
      })
    })
  },
  updateMessageStatus: (
    roomId: string,
    messageId: string,
    status: ChatMessage['status'],
  ) => {
    return sqliteCall('messageLocal.updateMessageStatus', () => {
      return new Promise<void>((resolve, reject) => {
        db.transaction((tx: Transaction) => {
          console.log('updateMessageStatus: ', roomId, messageId, status)
          const query = `UPDATE ${MESSAGE_TABLE} SET status = ? WHERE roomId = ? AND id = ?`
          tx.executeSql(
            query,
            [status, roomId, messageId],
            () => resolve(),
            (_, error) => {
              console.error('SQLite 쿼리 오류:', error)
              reject(error)
              return true
            },
          )
        })
      })
    })
  },
  getChatMessagesByCreated: (
    roomId: string,
    cursorCreatedAt?: number | null,
    pageSize: number = 20,
  ) => {
    return sqliteCall('messageLocal.getChatMessagesByCreated', () => {
      return new Promise<ChatMessage[]>((resolve, reject) => {
        db.transaction((tx: Transaction) => {
          const query = cursorCreatedAt
            ? `SELECT * FROM messages WHERE roomId = ? AND createdAt < ? ORDER BY createdAt DESC LIMIT ?`
            : `SELECT * FROM messages WHERE roomId = ? ORDER BY createdAt DESC LIMIT ?`
          const params = cursorCreatedAt
            ? [roomId, cursorCreatedAt, pageSize]
            : [roomId, pageSize]

          tx.executeSql(
            query,
            params,
            (_, result) => {
              const messages: ChatMessage[] = []
              for (let i = 0; i < result.rows.length; i++) {
                messages.push(result.rows.item(i))
              }
              // ✅ ASC 정렬 (오래된 메시지 → 최신 메시지 순)
              resolve(messages)
            },
            reject,
          )
        })
      })
    })
  },
  getChatMessageBySeq: (
    roomId: string,
    cursorSeq?: number | null,
    pageSize: number = 20,
  ) => {
    return sqliteCall('messageLocal.getChatMessageBySeq', async () => {
      return new Promise<ChatMessage[]>((resolve, reject) => {
        db.transaction((tx: Transaction) => {
          const query = cursorSeq
            ? `SELECT * FROM messages WHERE roomId = ? AND seq < ? ORDER BY createdAt DESC LIMIT ?`
            : `SELECT * FROM messages WHERE roomId = ? ORDER BY seq DESC LIMIT ?`
          const params = cursorSeq
            ? [roomId, cursorSeq, pageSize]
            : [roomId, pageSize]

          tx.executeSql(
            query,
            params,
            (_, result) => {
              const messages: ChatMessage[] = []
              for (let i = 0; i < result.rows.length; i++) {
                messages.push(result.rows.item(i))
              }
              // ✅ ASC 정렬 (오래된 메시지 → 최신 메시지 순)
              resolve(messages)
            },
            reject,
          )
        })
      })
    })
  },
  initMessageTable: () => {
    return sqliteCall('messageLocal.initMessageTable', async () => {
      await new Promise<void>((resolve, reject) => {
        db.transaction(
          (tx: Transaction) => {
            tx.executeSql(
              CREATE_MESSAGE_TABLE_SQL,
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
  clearAllMessages: () => {
    return sqliteCall('messageLocal.clearAllMessages', async () => {
      return new Promise<void>((resolve, reject) => {
        db.transaction(
          (tx: Transaction) => {
            tx.executeSql(`DELETE FROM ${MESSAGE_TABLE}`)
          },
          reject,
          resolve,
        )
      })
    })
  },
  getMaxLocalSeq: (roomId: string) => {
    return sqliteCall('messageLocal.getMaxLocalSeq', async () => {
      return new Promise<number>((resolve, reject) => {
        db.transaction((tx: Transaction) => {
          const query = `SELECT COUNT(*) FROM messages WHERE roomId = ?`
          tx.executeSql(
            query,
            [roomId],
            (_, result) => {
              const count = result.rows.item(0)['COUNT(*)']
              resolve(count)
            },
            (_, error) => {
              reject(error)
              return true // SQLite 트랜잭션 중단 + rollback
            },
          )
        })
      })
    })
  },
  getAllMessages: () => {
    return sqliteCall('messageLocal.getAllMessages', async () => {
      return new Promise<ChatMessage[]>((resolve, reject) => {
        db.transaction((tx: Transaction) => {
          // ✅ 오타 수정 + 정렬(필요한 컬럼명으로 바꿔)
          const query = `SELECT * FROM messages ORDER BY createdAt ASC`

          tx.executeSql(
            query,
            [],
            (_, result) => {
              const messages: ChatMessage[] = []
              for (let i = 0; i < result.rows.length; i++) {
                messages.push(result.rows.item(i) as ChatMessage)
              }
              resolve(messages)
            },
            (_, error) => {
              reject(error)
              return true
            },
          )
        })
      })
    })
  },
  isMessagesTableExists: () => {
    return sqliteCall('messageLocal.isMessagesTableExists', async () => {
      return new Promise((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            `SELECT name FROM sqlite_master WHERE type='table' AND name='messages';`,
            [],
            (_, result) => {
              const exists = result.rows.length > 0
              resolve(exists)
            },
            (_, error) => {
              console.log('error', error)
              reject(error)
              return true
            },
          )
        })
      })
    })
  },
  deleteMessageById: (roomId: string, messageId: string) => {
    return sqliteCall('messageLocal.deleteChatMessage', async () => {
      return new Promise<boolean>((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            `DELETE FROM ${MESSAGE_TABLE} WHERE roomId = ? AND id = ?`,
            [roomId, messageId],
            (_tx, result) => {
              // ✅ DELETE 결과는 rowsAffected로 판단
              resolve(result.rowsAffected > 0)
            },
            (_tx, error) => {
              console.log('deleteChatMessage error', error)
              reject(error)
              return true
            },
          )
        })
      })
    })
  },
}
