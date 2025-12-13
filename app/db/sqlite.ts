// import {FieldValue} from 'firebase-admin/firestore'
import type {Transaction} from 'react-native-sqlite-storage'
import {db} from '../shared/sqlite/sqlite'
import type {ChatMessage} from '../types/chat'
import {exec} from '../utils/data'
import {toMillisFromServerTime} from '../utils/firebase'

export const saveMessagesToSQLite = async (
  roomId: string,
  messages: ChatMessage[],
): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx: Transaction) => {
        messages.forEach(msg => {
          //동일한 아이디 기준으로 데이터를 대체하고, 아닌경우 추가하는 쿼리임
          tx.executeSql(
            `INSERT OR REPLACE INTO messages (id, roomId, text, senderId, createdAt, type, imageUrl, seq)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              msg.id,
              roomId,
              msg.text,
              msg.senderId,
              toMillisFromServerTime(msg.createdAt),
              msg.type,
              msg.imageUrl ?? '',
              msg.seq ?? 1,
            ],
          )
        })
      },
      error => {
        console.log(error)
        reject(error)
      },
      () => resolve(),
    )
  })
}

export const getMessagesFromSQLiteByPaging = async (
  roomId: string,
  cursorCreatedAt?: number | null,
  pageSize: number = 20,
): Promise<ChatMessage[]> => {
  return new Promise((resolve, reject) => {
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
          // const sortedMessages = messages.sort(
          //   (a, b) => a.createdAt - b.createdAt,
          // )
          resolve(messages)
        },
        (_, error) => {
          console.error('SQLite 쿼리 오류:', error)
          reject(error)
          return true
        },
      )
    })
  })
}

//sqlite 채팅방 메세지 모두 조회
export const getMessagesFromSQLite = async (
  roomId: string,
): Promise<ChatMessage[]> => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: Transaction) => {
      tx.executeSql(
        'SELECT * FROM messages WHERE roomId = ? ORDER BY createdAt DESC',
        [roomId],
        (_tx, results) => {
          const data: ChatMessage[] = []
          const rows = results.rows

          for (let i = 0; i < rows.length; i++) {
            data.push(rows.item(i))
          }
          resolve(data)
        },
        (_tx, error) => {
          reject(error)
          console.error('SQLite error', _tx, error)
          return []
        },
      )
    })
  })
}

//sqlite 테이블 생성
export const initChatTables = () => {
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS messages (
         id TEXT PRIMARY KEY,
          roomId TEXT NOT NULL,
          text TEXT,
          senderId TEXT NOT NULL,
          createdAt INTEGER NOT NULL,
          type TEXT NOT NULL,
          imageUrl TEXT,
          senderPicURL TEXT,
          senderName TEXT,
          seq INTEGER
      );`,
      [],
      () => console.log('✅ messages table created'),
      (_, error) => {
        console.error('❌ Failed to create messages table', error)
        return true
      },
    )
  })
}

export async function resetMessagesSchema(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.transaction(
      tx => {
        exec(tx, `DROP TABLE IF EXISTS messages`)
        exec(
          tx,
          `
          CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            roomId TEXT NOT NULL,
            text TEXT,
            senderId TEXT NOT NULL,
            createdAt INTEGER NOT NULL,
            type TEXT NOT NULL,
            imageUrl TEXT,
            senderPicURL TEXT,
            senderName TEXT,
            seq INTEGER
          )
        `,
        )
        exec(
          tx,
          `CREATE INDEX IF NOT EXISTS idx_messages_room_created ON messages (roomId, createdAt DESC)`,
        )
        exec(
          tx,
          `CREATE INDEX IF NOT EXISTS idx_messages_room_seq ON messages (roomId, seq DESC)`,
        )
      },
      err => reject(err),
      () => resolve(),
    )
  })
}

//메세지 테이블 생성 유무 조회
export const isMessagesTableExists = async (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='messages';`,
        [],
        (_, result) => {
          console.log(result)
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
}

//채팅창 마지막 메세지 날짜 조회
export const getLatestMessageCreatedAtFromSQLite = async (
  roomId: string | null,
): Promise<number | null> => {
  return new Promise((resolve, reject) => {
    if (!roomId) return resolve(null)
    db.transaction((tx: Transaction) => {
      tx.executeSql(
        `SELECT createdAt FROM messages WHERE roomId = ? ORDER BY createdAt DESC LIMIT 1`,
        [roomId],
        (_, result) => {
          if (result.rows.length > 0) {
            const latest = result.rows.item(0).createdAt
            resolve(latest)
          } else {
            resolve(null) // 데이터가 없는 경우
          }
        },
        (_, error) => {
          console.error('❌ 최신 메시지 createdAt 조회 실패:', error)
          reject(null)
          return true
        },
      )
    })
  })
}

//채팅방 초기화
export const clearMessagesFromSQLite = (roomId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx: Transaction) => {
        tx.executeSql(
          'DELETE FROM messages WHERE roomId = ?',
          [roomId],
          () => {
            resolve() // 성공 시
          },
          (_tx, error) => {
            reject(error) // 실패 시
            return false
          },
        )
      },
      error => {
        console.error('error', error)
        reject(error) // 트랜잭션 자체 실패 시
      },
    )
  })
}

//모든 sqlite 초기화
export const clearAllMessagesFromSQLite = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx: Transaction) => {
        tx.executeSql(
          'DELETE FROM messages', // 모든 메시지 삭제
          [],
          () => resolve(),
          (_, error) => {
            console.log('SQLite delete error:', error)
            reject(error)
            return false
          },
        )
        exec(tx, `DROP TABLE`)
      },
      error => {
        console.error('error', error)
        reject(error) // 트랜잭션 자체 실패 시
      },
    )
  })
}
