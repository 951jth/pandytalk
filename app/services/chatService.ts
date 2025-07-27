import {getApp} from '@react-native-firebase/app'
import {
  addDoc,
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
} from '@react-native-firebase/firestore'
import dayjs from 'dayjs'
import {useRef} from 'react'
import type {Transaction} from 'react-native-sqlite-storage'
import {db} from '../store/sqlite'
import {ChatMessage, RoomInfo, User} from '../types/firebase'
import {removeEmpty} from '../utils/format'

const firestore = getFirestore(getApp())

//채팅방 id 조회
export const getDirectMessageRoomId = async (
  myUid: string,
  targetUid: string,
): Promise<string | null> => {
  try {
    const chatsRef = collection(firestore, 'chats')
    const q = query(
      chatsRef,
      where('type', '==', 'dm'),
      where('members', 'array-contains', myUid),
    )

    const snapshot = await getDocs(q)

    const existingRoom = snapshot.docs.find(doc => {
      const members = doc.data().members
      return members?.length == 2 && members.includes(targetUid)
    })

    return existingRoom ? existingRoom.id : null
  } catch (e) {
    console.log(e)
    return null
  }
}

//채팅방 정보 조회 (멤버 및 채팅방 정보들들)
export const getChatRoomInfo = async (
  roomId: string,
): Promise<RoomInfo | void> => {
  // 1. chats/{roomId} 문서에서 members 배열 가져오기
  try {
    const chatDocRef = doc(firestore, 'chats', roomId)
    const chatSnap = await getDoc(chatDocRef)
    if (!chatSnap.exists()) {
      throw new Error('채팅방이 존재하지 않습니다.')
    }
    let roomInfo = {id: chatSnap.id, ...chatSnap?.data()} as RoomInfo
    const uids: string[] = chatSnap?.data()?.members ?? []

    // 2. users 컬렉션에서 해당 uid들의 유저 정보 가져오기
    const usersRef = collection(firestore, 'users')

    // ⚠️ Firestore의 where('uid', 'in', [...])는 최대 10개까지 지원
    const q = query(usersRef, where('uid', 'in', uids.slice(0, 10))) // 제한 고려

    const snapshot = await getDocs(q)

    const members =
      snapshot?.docs?.map(
        doc =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as User,
      ) || []

    roomInfo.memberInfos = members || null
    return roomInfo || null
  } catch (e) {
    console.error('getChatRoomInfo error', e)
  }
}

//채팅창 메세지 가져오기
export const getChatMessages = async (roomId: string) => {
  try {
    const messagesRef = collection(firestore, 'chats', roomId, 'messages')
    const q = query(messagesRef, orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)

    const messages = snapshot.docs.map(
      doc =>
        ({
          id: doc.id,
          ...doc?.data(),
        }) as ChatMessage,
    )
    return messages ?? null
  } catch (e) {
    console.log('get chat messages error', e)
    return []
  }
}

/**
 * 실시간 채팅 리스너 설정
 * @param roomId 채팅방 ID
 * @param onMessage 콜백 (새 메시지 수신 시)
 * @returns unsubscribe 함수 (리스너 해제용)
 */
// ✅ 비동기 함수로 정의
export const subscribeToMessages = async (
  roomId: string,
  lastCreatedAt: number | null,
  onMessage: (message: any) => void,
) => {
  const lastCreatedAtRef = useRef(lastCreatedAt || null)
  const db = getFirestore(getApp())
  const messagesRef = collection(db, 'chats', roomId, 'messages')

  // const lastCreatedAt = await getLatestMessageCreatedAtFromSQLite(roomId)
  const q = lastCreatedAt
    ? query(
        messagesRef,
        orderBy('createdAt', 'desc'),
        where('createdAt', '>', Timestamp.fromMillis(lastCreatedAt)),
      )
    : query(messagesRef, orderBy('createdAt', 'desc'))
  console.log('query', q)
  const unsubscribe = onSnapshot(q, snapshot => {
    console.log('lastCreatedAt', lastCreatedAt)
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
    onMessage(messages)
  })

  return unsubscribe // ✅ 진짜 해제 함수 리턴
}

//채팅 보내기
export const sendMessage = async (
  roomId: string,
  message: ChatMessage,
): Promise<void> => {
  try {
    const messagesRef = collection(firestore, 'chats', roomId, 'messages')
    const chatRoomRef = doc(firestore, 'chats', roomId)

    const newMessage = {
      senderId: message.senderId,
      text: message.text ?? '',
      type: message.type,
      imageUrl: message.imageUrl ?? '',
      createdAt: Date.now(),
      senderPicURL: message?.senderPicURL,
      senderName: message?.senderName,
    }

    // 1. 메시지 추가
    await addDoc(messagesRef, newMessage)

    // 2. 마지막 메시지 갱신
    await updateDoc(chatRoomRef, {
      lastMessage: newMessage,
    })
  } catch (error) {
    console.error('메시지 전송 실패:', error)
    throw error
  }
}

//채팅방 생성
export const createChatRoom = async (
  userId: string,
  targetIds: string[],
  options?: {
    name?: string
    image?: string
    type?: RoomInfo['type']
  },
): Promise<string | null> => {
  try {
    const sortedIds = [userId, ...targetIds].sort()
    const chatRef = collection(firestore, 'chats')
    const newRoom: Omit<RoomInfo, 'id'> = {
      type: options?.type ?? (targetIds.length >= 2 ? 'group' : 'dm'),
      createdAt: Date.now(),
      members: sortedIds?.filter(Boolean),
      name: options?.name ?? '',
      image: options?.image ?? '',
      // lastMessage: message,
    }

    // 1. 채팅방 생성 (자동 ID)
    const docRef = await addDoc(chatRef, removeEmpty(newRoom))
    const roomId = docRef.id

    return roomId
  } catch (e) {
    console.error('create room error', e)
    return null
  }
}

/**
 * 전체 RoomInfo 데이터를 받아 해당 채팅방 문서를 업데이트합니다.
 * @param roomId 채팅방 ID
 * @param roomData RoomInfo 또는 ChatRoom 포맷 객체 (id 필드는 제외됨)
 */
export const updateChatRoom = async (
  roomId: string,
  roomData: Partial<Omit<RoomInfo, 'id'>>,
): Promise<void> => {
  try {
    const chatDocRef = doc(firestore, 'chats', roomId)

    await updateDoc(chatDocRef, roomData)
  } catch (error) {
    console.error('채팅방 정보 업데이트 실패:', error)
    throw error
  }
}

//유저 채팅 마지막 읽음 시간 갱신
export const updateLastRead = async (roomId: string, userId: string) => {
  try {
    const chatDocRef = doc(firestore, 'chats', roomId)
    await updateDoc(chatDocRef, {
      [`lastReadTimestamps.${userId}`]: Date.now(), // ✅ number(ms)
    })
  } catch (e) {
    console.error('채팅방 정보 업데이트 실패:', e)
  }
}

//안읽은 메세지 수 조회
export const getUnreadCount = async (
  roomId: string,
  userId: string,
  lastRead?: number,
) => {
  const messagesRef = collection(firestore, 'chats', roomId, 'messages')

  const q = query(messagesRef, where('createdAt', '>', lastRead ?? 0))

  const snapshot = await getCountFromServer(q) // ✅ 빠른 count-only 쿼리
  return snapshot.data().count
}

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
            `INSERT OR REPLACE INTO messages (id, roomId, text, senderId, createdAt, type, imageUrl)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              msg.id,
              roomId,
              msg.text,
              msg.senderId,
              msg.createdAt,
              msg.type,
              msg.imageUrl ?? '',
            ],
          )
        })
      },
      error => reject(error),
      () => resolve(),
    )
  })
}

export const getMessagesFromSQLiteByPaging = async (
  roomId: string,
  cursorCreatedAt?: number,
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
        id TEXT PRIMARY KEY NOT NULL,
        roomId TEXT NOT NULL,
        text TEXT,
        senderId TEXT,
        createdAt INTEGER,
        type TEXT,
        imageUrl TEXT
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

//메세지 테이블 생성 유무 조회
export const isMessagesTableExists = async (): Promise<boolean> => {
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
            console.log(dayjs(latest).format('YYYY.MM.DD HH:mm:ss'))
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

//마지막 데이터 날짜 이후로 데이터 존재여부 확인
export const getMessagesFromLatestRead = async (
  roomId: string,
  latestCreated: number,
) => {
  console.log('latestCreated', latestCreated)
  const messagesRef = collection(firestore, 'chats', roomId, 'messages')
  const q = query(
    messagesRef,
    orderBy('createdAt', 'desc'),
    where('createdAt', '>', Timestamp.fromMillis(latestCreated)),
  )
  const snapshot = await getDocs(q)
  const messages = snapshot?.docs?.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as ChatMessage[]
  return messages ?? []
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
        reject(error) // 트랜잭션 자체 실패 시
      },
    )
  })
}

//모든 sqlite 초기화
export const clearAllMessagesFromSQLite = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
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
    })
  })
}
