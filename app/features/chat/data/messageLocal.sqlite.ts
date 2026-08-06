import {
  MESSAGE_COLUMN_SQL,
  MESSAGE_PLACEHOLDERS,
  MESSAGE_TABLE,
} from '@app/features/chat/data/messages.schema'
import {db} from '@app/shared/sqlite/sqlite'
import {sqliteCall} from '@app/shared/sqlite/sqliteCall'
import {ChatMessage} from '@app/shared/types/chat'
import {toMillisFromServerTime} from '@app/shared/utils/firebase'
import {Transaction} from 'react-native-sqlite-storage'

type ChatMessageSqliteRow = Omit<ChatMessage, 'imageUrls'> & {
  imageUrls?: string | string[]
}

// const logAiResponseExpirationFromSQLite = (
//   roomId: string,
//   message: ChatMessageSqliteRow,
// ) => {
//   if (!__DEV__ || message.type !== 'ai_text') return
//
//   console.log('[SQLite] loaded AI response expiration', {
//     roomId,
//     messageId: message.id,
//     aiResponseExpiresAt: message.aiResponseExpiresAt,
//   })
// }

export const messageLocal = {
  //채팅방 마이그레이션 중에는 sqliteCall의 순서를 보장하는 옵션임.
  saveMessagesToSQLite: (roomId: string, messages: ChatMessage[]) => {
    return sqliteCall(
      'messageLocal.saveMessagesToSQLite',
      () => {
        if (!messages?.length) return Promise.resolve()
        return new Promise<void>((resolve, reject) => {
          const query = `INSERT OR REPLACE INTO ${MESSAGE_TABLE} (${MESSAGE_COLUMN_SQL}) VALUES (${MESSAGE_PLACEHOLDERS})`
          db.transaction(
            (tx: Transaction) => {
              for (const msg of messages) {
                // values 매핑
                const values = [
                  msg.id,
                  roomId,
                  msg.text ?? '',
                  msg.senderId,
                  toMillisFromServerTime(msg.createdAt),
                  msg.type,
                  msg.imageUrl ?? '',
                  msg.senderPicURL ?? '',
                  msg.senderName ?? '',
                  msg.seq ?? 1,
                  msg.status ?? 'success',
                  JSON.stringify(msg.imageUrls || []),
                  toMillisFromServerTime(msg.aiResponseExpiresAt),
                ]
                tx.executeSql(query, values, undefined, (_tx, error) => {
                  console.error('[SQLite] saveMessagesToSQLite stmt fail', {
                    roomId,
                    msgId: msg.id,
                    error,
                  })
                  return true
                })
              }
            },
            err => {
              console.error('[SQLite] saveMessagesToSQLite tx fail', err)
              reject(err)
            },
            () => resolve(),
          )
        })
      },
      {lock: true}, //메세지를 쓸때는 테이블마이그레이션(재생성)이 끝난 뒤에 설정하도록함
    )
  },
  updateMessageStatus: (
    roomId: string,
    messageId: string,
    status: ChatMessage['status'],
  ) => {
    return sqliteCall(
      'messageLocal.updateMessageStatus',
      () => {
        return new Promise<void>((resolve, reject) => {
          db.transaction((tx: Transaction) => {
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
      },
      {lock: true}, //테이블마이그레이션(재생성)이 끝난 뒤에 설정하도록함
    )
  },
  // 전송 성공 시 로컬 메시지의 상태와 서버 seq를 함께 반영
  markMessageAsSuccess: (
    roomId: string,
    messageId: string,
    seq: number,
  ) => {
    return sqliteCall(
      'messageLocal.markMessageAsSuccess',
      () => {
        return new Promise<boolean>((resolve, reject) => {
          db.transaction((tx: Transaction) => {
            tx.executeSql(
              `UPDATE ${MESSAGE_TABLE} SET status = 'success', seq = ? WHERE roomId = ? AND id = ?`,
              [seq, roomId, messageId],
              (_tx, result) => resolve(result.rowsAffected > 0),
              (_tx, error) => {
                console.error('[SQLite] markMessageAsSuccess query failed', {
                  roomId,
                  messageId,
                  seq,
                  error,
                })
                reject(error)
                return true
              },
            )
          })
        })
      },
      {lock: true},
    )
  },
  // 전송 결과가 늦게 도착해도 success가 failed로 역행하지 않도록 pending일 때만 실패 처리
  markMessageAsFailedIfPending: (roomId: string, messageId: string) => {
    return sqliteCall(
      'messageLocal.markMessageAsFailedIfPending',
      () => {
        return new Promise<boolean>((resolve, reject) => {
          db.transaction((tx: Transaction) => {
            tx.executeSql(
              `UPDATE ${MESSAGE_TABLE} SET status = 'failed' WHERE roomId = ? AND id = ? AND status = 'pending'`,
              [roomId, messageId],
              (_tx, result) => resolve(result.rowsAffected > 0),
              (_tx, error) => {
                console.error(
                  '[SQLite] markMessageAsFailedIfPending query failed',
                  {roomId, messageId, error},
                )
                reject(error)
                return true
              },
            )
          })
        })
      },
      {lock: true},
    )
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
            ? 'SELECT * FROM messages WHERE roomId = ? AND createdAt < ? ORDER BY createdAt DESC LIMIT ?'
            : 'SELECT * FROM messages WHERE roomId = ? ORDER BY createdAt DESC LIMIT ?'
          const params = cursorCreatedAt
            ? [roomId, cursorCreatedAt, pageSize]
            : [roomId, pageSize]

          tx.executeSql(
            query,
            params,
            (_, result) => {
              const messages: ChatMessage[] = []
              for (let i = 0; i < result.rows.length; i++) {
                const item = result.rows.item(i)
                if (item.imageUrls) {
                  try {
                    item.imageUrls = JSON.parse(item.imageUrls)
                  } catch (e) {
                    item.imageUrls = []
                  }
                }
                // logAiResponseExpirationFromSQLite(roomId, item)
                messages.push(item)
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
  getChatMessagesBySeq: (
    roomId: string,
    cursorSeq?: number | null,
    pageSize: number = 20,
  ) => {
    return sqliteCall('messageLocal.getChatMessagesBySeq', async () => {
      return new Promise<ChatMessage[]>((resolve, reject) => {
        db.transaction((tx: Transaction) => {
          const query = cursorSeq
            ? 'SELECT * FROM messages WHERE roomId = ? AND seq < ? ORDER BY seq DESC LIMIT ?'
            : 'SELECT * FROM messages WHERE roomId = ? ORDER BY seq DESC LIMIT ?'
          const params = cursorSeq
            ? [roomId, cursorSeq, pageSize]
            : [roomId, pageSize]

          tx.executeSql(
            query,
            params,
            (_, result) => {
              const messages: ChatMessage[] = []
              for (let i = 0; i < result.rows.length; i++) {
                const item = result.rows.item(i)
                if (item.imageUrls) {
                  try {
                    item.imageUrls = JSON.parse(item.imageUrls)
                  } catch (e) {
                    item.imageUrls = []
                  }
                }
                // logAiResponseExpirationFromSQLite(roomId, item)
                messages.push(item)
              }
              resolve(messages)
            },
            reject,
          )
        })
      })
    })
  },
  clearAllMessages: () => {
    return sqliteCall('messageLocal.clearAllMessages', async () => {
      return new Promise<void>((resolve, reject) => {
        db.transaction(
          (tx: Transaction) => {
            tx.executeSql('DELETE FROM messages')
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
          const query = 'SELECT MAX(seq) as maxSeq FROM messages WHERE roomId = ?'
          tx.executeSql(
            query,
            [roomId],
            (_, result) => {
              const maxSeq = result.rows.item(0).maxSeq
              resolve(maxSeq || 0)
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
          const query = 'SELECT * FROM messages ORDER BY createdAt ASC'

          tx.executeSql(
            query,
            [],
            (_, result) => {
              const messages: ChatMessage[] = []
              for (let i = 0; i < result.rows.length; i++) {
                const item = result.rows.item(i) as ChatMessageSqliteRow
                if (item.imageUrls) {
                  try {
                    item.imageUrls =
                      typeof item.imageUrls === 'string'
                        ? JSON.parse(item.imageUrls)
                        : item.imageUrls
                  } catch (e) {
                    item.imageUrls = []
                  }
                }
                messages.push(item as ChatMessage)
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

  getMessageById: (roomId: string, messageId: string) => {
    return sqliteCall('messageLocal.getMessageById', async () => {
      return new Promise<ChatMessage | null>((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            `SELECT * FROM ${MESSAGE_TABLE} WHERE roomId = ? AND id = ? LIMIT 1`,
            [roomId, messageId],
            (_tx, result) => {
              if (result.rows.length === 0) {
                resolve(null)
                return
              }

              const item = result.rows.item(0) as ChatMessageSqliteRow
              if (item.imageUrls) {
                try {
                  item.imageUrls =
                    typeof item.imageUrls === 'string'
                      ? JSON.parse(item.imageUrls)
                      : item.imageUrls
                } catch (e) {
                  item.imageUrls = []
                }
              }
              // logAiResponseExpirationFromSQLite(roomId, item)
              resolve(item as ChatMessage)
            },
            (_tx, error) => {
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
  //메세지 테이블 삭제는 최후의 수단,
  dropMessageTable: () => {
    return sqliteCall(
      'messageLocal.dropMessageTable',
      async () => {
        return new Promise<void>((resolve, reject) => {
          db.transaction(
            (tx: Transaction) => {
              tx.executeSql(`DROP TABLE IF EXISTS ${MESSAGE_TABLE};`)
            },
            reject,
            resolve,
          )
        })
      },
      {lock: true},
    )
  },
  //채팅방 초기화
  clearMessagesByChatRoomId: (roomId: string) => {
    return sqliteCall('messageLocal.clearMessagesByChatRoomId', async () => {
      return new Promise<void>((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            `DELETE FROM ${MESSAGE_TABLE} WHERE roomId = ?`,
            [roomId],
            () => resolve(),
            (_, error) => {
              console.log('clearMessagesByChatRoomId error', error)
              reject(error)
              return true
            },
          )
        })
      })
    })
  },
}
