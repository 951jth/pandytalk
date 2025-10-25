import {getApp} from '@react-native-firebase/app'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  Timestamp,
  updateDoc,
  where,
} from '@react-native-firebase/firestore'
// import {FieldValue} from 'firebase-admin/firestore'
import {useRef} from 'react'
import type {Transaction} from 'react-native-sqlite-storage'
import {db} from '../store/sqlite'
import type {User} from '../types/auth'
import type {ChatListItem, ChatMessage, ServerTime} from '../types/chat'
import {exec} from '../utils/data'
import {toMillisFromServerTime, toRNFTimestamp} from '../utils/firebase'
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

//타입별 멤버 조회 호출 함수,(dm, group) : 과거
//멤버 정보가 바뀌게 될 수 있어서, id로 별도로 조회해야함.
const setChatMembersInfo = async (roomInfo: ChatListItem) => {
  try {
    //현재는 그룹의 멤버가 변경되면 클라우드펑션에서 자동으로 채팅멤버 세팅해줘서 사용 switch 문 사용하지않음
    let uids = roomInfo?.members ?? []
    // //1. 멤버 아이디들 세팅
    // switch (roomInfo.type) {
    //   //CASE 1. DM 채팅 (1:1, or 1:N) uids
    //   case 'dm':
    //     uids = roomInfo?.members ?? []
    //     break
    //   //CASE 2. GROUP 채팅 uids
    //   case 'group':
    //     const gid = roomInfo?.groupId as string
    //     if (!gid) return roomInfo
    //     const groupMemsRef = collection(firestore, 'groups', gid, 'members')
    //     const gq = query(groupMemsRef)
    //     const gSnapshot = await getDocs(gq)
    //     const gMembers =
    //       gSnapshot?.docs?.map(
    //         doc =>
    //           ({
    //             id: doc.id,
    //             ...doc.data(),
    //           }) as User,
    //       ) || []
    //     uids = gMembers?.map(e => e.id as string) ?? []

    //     break
    // }
    //2. id를 기반으로 현재 멤버들의 정보 세팅
    if (uids) {
      // users 컬렉션에서 해당 uid들의 유저 정보 가져오기
      const usersRef = collection(firestore, 'users')
      // ⚠️ Firestore의 where('uid', 'in', [...])는 최대 10개까지 지원
      const q = query(usersRef, where('uid', 'in', uids.slice(0, 10))) // 제한 고려

      const snapshot = await getDocs(q)

      const memberInfos =
        snapshot?.docs?.map(
          doc =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as User,
        ) || []
      roomInfo.members = uids
      roomInfo.memberInfos = memberInfos
    }
    return roomInfo
  } catch (e) {
    console.log(e)
    return roomInfo
  }
}

//채팅방 정보 조회 (멤버 및 채팅방 정보들들)
export const getChatRoomInfo = async (
  roomId: string,
): Promise<ChatListItem | void> => {
  // 1. chats/{roomId} 문서에서 members 배열 가져오기
  try {
    console.log('roomId: ', roomId)
    const chatDocRef = doc(firestore, 'chats', roomId)
    const chatSnap = await getDoc(chatDocRef)
    if (!chatSnap.exists()) {
      throw new Error('채팅방이 존재하지 않습니다.')
    }
    // console.log('chatSnap', chatSnap)
    let roomInfo = {id: chatSnap.id, ...chatSnap?.data()} as ChatListItem

    // 2. users 컬렉션에서 해당 uid들의 유저 정보 가져오기
    // const uids: string[] = chatSnap?.data()?.members ?? []
    // const usersRef = collection(firestore, 'users')
    // ⚠️ Firestore의 where('uid', 'in', [...])는 최대 10개까지 지원
    // const q = query(usersRef, where('uid', 'in', uids.slice(0, 10))) // 제한 고려

    // const snapshot = await getDocs(q)

    // const members =
    //   snapshot?.docs?.map(
    //     doc =>
    //       ({
    //         id: doc.id,
    //         ...doc.data(),
    //       }) as User,
    //   ) || []
    roomInfo = await setChatMembersInfo(roomInfo)
    return roomInfo || null
  } catch (e) {
    console.log('getChatRoomInfo error', e)
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

//채팅 보내기
export const sendMessage = async (
  roomId: string,
  message: ChatMessage,
): Promise<void> => {
  const chatRef = doc(firestore, 'chats', roomId)
  const msgRef = doc(collection(firestore, `chats/${roomId}/messages`)) // 새 메시지 문서 ID 미리 생성

  //runTransaction이란? Firestore의 원자적(atomic) 읽기→계산→쓰기 작업을 한 덩어리로 처리하는 API
  //   무엇을 보장하나요?
  // 원자성: 트랜잭션 내 쓰기는 전부 성공하거나 전부 실패.
  // 일관성/재시도: 다른 클라이언트가 중간에 값을 바꾸면 SDK가 자동으로 다시 읽고 재시도.
  // 경합 안전: 시퀀스 증가, 재고 차감, 포인트 적립 같이 “읽은 값 기반 계산”에 적합.

  // 언제 쓰나요? (vs writeBatch)
  // 트랜잭션: “문서를 읽고 → 그 값으로 계산해서 → 쓴다”가 필요할 때.

  // 배치(writeBatch): “그냥 여러 문서를 한 번에 쓴다”(읽고 계산 X)일 때.

  // 사용 규칙 & 팁

  // 트랜잭션 안에서는 tx.get(docRef)로 ‘문서’만 읽을 수 있음(쿼리 읽기 X).

  // 사이드 이펙트(네트워크 호출/알림 전송 등)는 트랜잭션 밖에서.

  // 실패 시 SDK가 재시도하므로, 순수 계산(idempotent) 로 작성.

  // 한 트랜잭션당 최대 500개 쓰기 권장(일반 배치와 동일 상한).

  // 비용: 읽기/쓰기는 일반과 동일하게 과금되고, 재시도하면 그만큼 읽기/쓰기가 더 발생.
  await runTransaction(firestore, async tx => {
    // 1) 현재 lastSeq 읽고 +1
    const chatSnap = await tx.get(chatRef)
    const prev = (chatSnap.get('lastSeq') as number) ?? 0
    const next = prev + 1
    const now = serverTimestamp()

    // 2) 메시지 문서 작성 (seq 포함)
    const newMessage = {
      seq: next,
      senderId: message.senderId,
      text: message.text ?? '',
      type: message.type,
      imageUrl: message.imageUrl ?? '',
      createdAt: now, // 서버시간
      senderPicURL: message?.senderPicURL ?? null,
      senderName: message?.senderName ?? null,
    }
    tx.set(msgRef, newMessage)

    // 3) 채팅방 문서 갱신 (lastSeq/lastMessage/lastMessageAt)
    //    방 문서가 없을 가능성이 있으면 update 대신 set(..., {merge:true}) 사용
    tx.update(chatRef, {
      lastSeq: next,
      lastMessageAt: now,
      lastMessage: {
        // 리스트 미리보기용 필드만 넣는 걸 권장 (전체 message와 동일하게 둘 수도 있음)
        seq: next,
        text: newMessage.text,
        senderId: newMessage.senderId,
        createdAt: now,
        type: newMessage.type,
        imageUrl: newMessage.imageUrl,
      },
    })
  })
}

//채팅방 생성
export const createChatRoom = async (
  userId: string,
  targetIds: string[],
  options?: {
    name?: string
    image?: string
    type?: ChatListItem['type']
  },
): Promise<string | null> => {
  try {
    const sortedIds = [userId, ...targetIds].sort()
    const chatRef = collection(firestore, 'chats')
    const newRoom: Omit<ChatListItem, 'id'> = {
      type: options?.type ?? (targetIds.length >= 2 ? 'group' : 'dm'),
      createdAt: serverTimestamp(),
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
  roomData: Partial<Omit<ChatListItem, 'id'>>,
): Promise<void> => {
  try {
    const chatDocRef = doc(firestore, 'chats', roomId)

    await updateDoc(chatDocRef, roomData)
  } catch (error) {
    console.error('채팅방 정보 업데이트 실패:', error)
    throw error
  }
}

export async function updateLastRead(
  roomId: string,
  userId: string,
  seenSeq: number, // 마지막으로 보인 메시지의 seq (모르면 생략)
) {
  try {
    const chatRef = doc(firestore, 'chats', roomId)
    //현재 채팅방에서 가장 높은 시퀀스 계산하기.
    await runTransaction(firestore, async tx => {
      tx.update(chatRef, {
        [`lastReadSeqs.${userId}`]: seenSeq,
        [`lastReadTimestamps.${userId}`]: serverTimestamp(),
      })
    })
  } catch (e) {
    console.log(e)
  }
}

export const saveMessagesToSQLite = async (
  roomId: string,
  messages: ChatMessage[],
): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx: Transaction) => {
        console.log('roomID', roomId)
        console.log('messages', messages)
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
      error => reject(error),
      () => resolve(),
    )
  })
}

export const getMessagesFromSQLiteByPaging = async (
  roomId: string,
  cursorCreatedAt?: number | null,
  pageSize: number = 20,
): Promise<ChatMessage[]> => {
  console.log('cursorCreatedAt', cursorCreatedAt)
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
          console.log('messages', messages)
          for (let i = 0; i < result.rows.length; i++) {
            messages.push(result.rows.item(i))
          }
          // ✅ ASC 정렬 (오래된 메시지 → 최신 메시지 순)
          // const sortedMessages = messages.sort(
          //   (a, b) => a.createdAt - b.createdAt,
          // )
          console.log('get sql messages', messages)
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
        imageUrl TEXT,
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

//마지막 데이터 날짜 이후로 데이터 존재여부 확인
export const getMessagesFromLatestRead = async (
  roomId: string,
  latestCreated: number | ServerTime | null,
) => {
  if (!latestCreated) return []
  console.log('latestCreated', latestCreated)
  const cursor = toRNFTimestamp(latestCreated)
  const messagesRef = collection(firestore, 'chats', roomId, 'messages')
  const q = query(
    messagesRef,
    orderBy('createdAt', 'desc'),
    startAfter(cursor),
    // where('createdAt', '>', Timestamp.fromMillis(latestCreated)),
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

// ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ미사용ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
/**
 * 실시간 채팅 리스너 설정
 * @param roomId 채팅방 ID
 * @param onMessage 콜백 (새 메시지 수신 시)
 * @returns unsubscribe 함수 (리스너 해제용)
 */
// 비동기 함수로 정의, 미사용
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

//안읽은 메세지 수 조회 현재 seq구조로 변경
// export const getUnreadCount = async (
//   roomId: string,
//   userId: string,
//   lastRead?: number,
// ) => {
//   const messagesRef = collection(firestore, 'chats', roomId, 'messages')

//   const q = query(messagesRef, where('createdAt', '>', lastRead ?? 0))

//   const snapshot = await getCountFromServer(q) // ✅ 빠른 count-only 쿼리
//   return snapshot.data().count
// }
