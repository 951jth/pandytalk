import {
  firebaseCall,
  firebaseObserver,
} from '@app/shared/firebase/firebaseUtils'
import {firestore} from '@app/shared/firebase/firestore'
import {toPageResult} from '@app/shared/firebase/pagination'
import type {ChatMessage} from '@app/shared/types/chat'
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  where,
  type FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore'

const debug = true

export const messageRemote = {
  getChatMessages: (
    roomId: string,
    ts?: FirebaseFirestoreTypes.Timestamp | null, //firebase 타임스탬프로 변환해서 보내야함.
    pageSize?: number,
  ) => {
    return firebaseCall('messageRemote.getChatMessages', async () => {
      const PAGE_SIZE = pageSize ?? 20
      const messagesRef = collection(firestore, 'chats', roomId, 'messages')

      const constraints = [orderBy('createdAt', 'desc'), limit(PAGE_SIZE)]
      if (ts) {
        constraints.push(startAfter(ts))
      }
      const q = query(messagesRef, ...constraints)
      const snapshot = await getDocs(q)
      const result = toPageResult<ChatMessage>(snapshot.docs, PAGE_SIZE, d => ({
        id: d.id,
        ...d.data(),
      }))
      return result
    })
  },
  getChatMessageBySeq: async (
    roomId: string,
    seq: number,
    pageSize?: number,
  ) => {
    return firebaseCall('messageRemote.getChatMessageBySeq', async () => {
      const messagesRef = collection(firestore, 'chats', roomId, 'messages')
      const constraints = [where('seq', '>', seq), orderBy('seq', 'asc')]
      if (pageSize) {
        constraints.push(limit(pageSize))
      }
      const q = query(messagesRef, ...constraints)
      const snapshot = await getDocs(q)
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ChatMessage[]
      return newMessages
    })
  },
  subscribeChatMessages: (
    roomId: string,
    lastSeq: number | null | undefined,
    callback: (docs: ChatMessage[]) => void,
  ) => {
    if (!roomId) return () => {}

    // const ts = toRNFTimestamp(lastCreatedAt)
    const messagesRef = collection(firestore, 'chats', roomId, 'messages')

    let messageQuery = query(messagesRef, orderBy('seq', 'desc'), limit(50))

    if (lastSeq) messageQuery = query(messageQuery, where('seq', '>', lastSeq))

    return firebaseObserver(
      `messageRemote.subscribeChatMessages_${roomId}`,
      messageQuery,
      snapshot => {
        const newMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as ChatMessage[]

        callback(newMessages)
      },
      error => {
        console.warn(`subscribeChatMessages_error: ${roomId}`, error)
      },
    )
  },
  // 1ID 생성만 해주는 헬퍼 함수 (서비스 레이어는 얘만 부르면 됨)
  generateMessageId: (roomId: string): string => {
    const messagesRef = collection(firestore, 'chats', roomId, 'messages')
    return doc(messagesRef).id // 깔끔하게 ID 문자열만 리턴!
  },
  sendChatMessage: (
    roomId: string,
    message: Omit<ChatMessage, 'createdAt'>,
  ) => {
    return firebaseCall('messageRemote.sendChatMessage', async () => {
      const chatRef = doc(firestore, 'chats', roomId)
      //runTransaction : 읽기→계산→쓰기 작업을 한 덩어리로 처리하는 API
      const messageId = message.id
      let msgRef = null
      // 변경 후: 받아온 ID로 참조 생성 (이 시점엔 문서는 없고 주소만 찍은 상태)
      if (messageId) {
        msgRef = doc(firestore, 'chats', roomId, 'messages', messageId)
      } else {
        msgRef = doc(collection(firestore, 'chats', roomId, 'messages'))
      }

      //여러 명이 동시에 채팅을 칠 때 단순히 addDoc으로 넣으면 네트워크 속도에 따라 메시지 순서가 뒤죽박죽됨
      await runTransaction(firestore, async tx => {
        // 1) 현재 채팅방 lastSeq가져오기
        const chatSnap = await tx.get(chatRef)
        const prev = (chatSnap.get('lastSeq') as number) ?? 0
        const next = prev + 1
        const now = serverTimestamp()
        // 2) 메시지 문서 작성
        const newMessage = {
          seq: next,
          senderId: message.senderId,
          text: message.text ?? '',
          type: message.type,
          imageUrl: message.imageUrl ?? '',
          createdAt: now,
          senderPicURL: message?.senderPicURL ?? null,
          senderName: message?.senderName ?? null,
        }
        tx.set(msgRef, newMessage)
        // 3) 채팅방 갱신
        tx.update(chatRef, {
          lastSeq: next,
          lastMessageAt: now,
          lastMessage: {
            seq: next,
            text: newMessage.text,
            senderId: newMessage.senderId,
            createdAt: now,
            type: newMessage.type,
            imageUrl: newMessage.imageUrl,
          },
        })
      })
    })
  },
}
