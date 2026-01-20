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
} from '@react-native-firebase/firestore'

const debug = true

export const messageRemote = {
  getChatMessagesBySeq: (roomId: string, seq?: number, pageSize?: number) => {
    return firebaseCall('messageRemote.getChatMessagesBySeq', async () => {
      const messagesRef = collection(firestore, 'chats', roomId, 'messages')
      const PAGE_SIZE = pageSize ?? 20
      const constraints = [
        seq ? where('seq', '<', seq) : null,
        orderBy('seq', 'desc'), // ✅ 최신→과거 방향으로 페이지 잘림
        limit(PAGE_SIZE),
      ].filter(Boolean)
      const q = query(messagesRef, ...constraints)
      const snapshot = await getDocs(q)
      const result = toPageResult<ChatMessage>(snapshot.docs, PAGE_SIZE, d => ({
        id: d.id,
        ...d.data(),
      }))
      return result
    })
  },
  getAllChatMessagesFromSeq: async (roomId: string, seq: number) => {
    return firebaseCall('messageRemote.getAllChatMessagesFromSeq', async () => {
      const messagesRef = collection(firestore, 'chats', roomId, 'messages')
      const constraints = [where('seq', '>', seq), orderBy('seq', 'asc')]
      const q = query(messagesRef, ...constraints)
      const snapshot = await getDocs(q)
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ChatMessage[]
      return newMessages
    })
  },
  subscribeChatMessages: async (
    roomId: string,
    lastSeq: number | null | undefined,
    callback: (docs: ChatMessage[]) => void,
  ) => {
    if (!roomId) return () => {}

    // const ts = toRNFTimestamp(lastCreatedAt)
    const messagesRef = collection(firestore, 'chats', roomId, 'messages')
    let messageQuery // 초기값 없이 선언만 함
    // 1. 로컬 데이터가 있는 경우: lastSeq 이후만 구독 (가장 효율적)
    if (lastSeq) {
      //lastSeq가 0인 경우도 채팅방이 없는 경우임. 항상 1부터 시작
      messageQuery = query(
        messagesRef,
        orderBy('seq', 'asc'),
        where('seq', '>', lastSeq),
      )
    }
    // 2. 로컬 데이터가 없는 경우: 최신 데이터의 마지막 시간을 기준으로 읽기.
    else {
      // 2-1. 서버에서 가장 최신 메시지 1개 가져오기
      const anchorSnapshot = await getDocs(
        query(messagesRef, orderBy('createdAt', 'desc'), limit(1)),
      )

      if (!anchorSnapshot.empty) {
        // 최신데이터가 있으면 그시점 부터 구독
        const lastDoc = anchorSnapshot.docs[0]
        messageQuery = query(
          messagesRef,
          orderBy('createdAt', 'asc'), // 시간 순서대로 받음
          startAfter(lastDoc),
        )
      } else {
        // 빈 방임 -> 처음부터 구독 (어차피 데이터 0개)
        messageQuery = query(messagesRef, orderBy('createdAt', 'asc'))
      }
    }

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
  // 1ID 생성만 해주는 헬퍼 함수
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
      const messageId = message.id
      let msgRef = null
      if (messageId) {
        msgRef = doc(firestore, 'chats', roomId, 'messages', messageId)
      } else {
        msgRef = doc(collection(firestore, 'chats', roomId, 'messages'))
      }

      //여러 명이 동시에 채팅을 칠 때 단순히 addDoc으로 넣으면 네트워크 속도에 따라 메시지 순서가 뒤죽박죽됨
      await runTransaction(firestore, async tx => {
        // 1) 현재 채팅방 lastSeq가져오기
        const chatSnap = await tx.get(chatRef)
        const prev = Number(chatSnap.get('lastSeq') ?? 0)
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
