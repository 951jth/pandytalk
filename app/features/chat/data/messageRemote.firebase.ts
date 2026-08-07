import {
  firebaseCall,
  firebaseObserver,
} from '@app/shared/firebase/firebaseUtils'
import {firestore} from '@app/shared/firebase/firestore'
import {toPageResult} from '@app/shared/firebase/pagination'
import type {ChatMessage} from '@app/shared/types/chat'
import type {ServerTime} from '@app/shared/types/firebase'
import {AI_IMAGE_LIMIT} from '@shared/constants/chat'
import {
  collection,
  doc,
  FirebaseFirestoreTypes,
  getDocFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from '@react-native-firebase/firestore'

export type SendChatMessageResult = {
  id: string
  seq: number
  alreadySent: boolean
}

type SendChatMessagePayload = Omit<ChatMessage, 'createdAt'>

export const messageRemote = {
  /** 디스크 캐시를 우회하고 특정 메시지의 현재 서버 상태를 조회합니다. */
  getChatMessageById: (roomId: string, messageId: string) => {
    return firebaseCall('messageRemote.getChatMessageById', async () => {
      const messageRef = doc(
        firestore,
        'chats',
        roomId,
        'messages',
        messageId,
      )
      const snapshot = await getDocFromServer(messageRef)

      if (!snapshot.exists()) return null

      return {
        id: snapshot.id,
        ...snapshot.data(),
      } as ChatMessage
    })
  },
  getLatestSeq: async (roomId: string): Promise<number> => {
    return firebaseCall('messageRemote.getLatestSeq', async () => {
      const messagesRef = collection(firestore, 'chats', roomId, 'messages')
      const q = query(messagesRef, orderBy('seq', 'desc'), limit(1))
      const snapshot = await getDocs(q)
      if (snapshot.empty) return 0
      return snapshot.docs[0].data().seq ?? 0
    })
  },
  getChatMessagesBySeq: (roomId: string, seq?: number, pageSize?: number) => {
    return firebaseCall('messageRemote.getChatMessagesBySeq', async () => {
      const messagesRef = collection(firestore, 'chats', roomId, 'messages')
      const PAGE_SIZE = pageSize ?? 20
      const constraints = [
        seq ? where('seq', '<', seq) : null,
        orderBy('seq', 'desc'),
        limit(PAGE_SIZE),
      ].filter(Boolean)
      const q = query(messagesRef, ...constraints)
      const snapshot = await getDocs(q)
      const result = toPageResult(snapshot.docs, PAGE_SIZE, d => ({
        id: d.id,
        ...d.data(),
      }) as ChatMessage)
      return result
    })
  },
  getAllChatMessagesFromSeq: async (
    roomId: string,
    seq: number,
    limitCount: number = 100,
  ) => {
    return firebaseCall('messageRemote.getAllChatMessagesFromSeq', async () => {
      const messagesRef = collection(firestore, 'chats', roomId, 'messages')
      const constraints = [
        where('seq', '>', seq),
        orderBy('seq', 'asc'),
        limit(limitCount),
      ]
      const q = query(messagesRef, ...constraints)
      const snapshot = await getDocs(q)
      const newMessages = snapshot.docs.map(messageDoc => ({
        id: messageDoc.id,
        ...messageDoc.data(),
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
    const PAGE_SIZE = 20
    const messagesRef = collection(firestore, 'chats', roomId, 'messages')
    const messageQuery = query(
      messagesRef,
      where('seq', '>', lastSeq ?? 0),
      orderBy('seq', 'desc'),
      limit(PAGE_SIZE),
    )

    return firebaseObserver(
      `messageRemote.subscribeChatMessages_${roomId}`,
      messageQuery,
      snapshot => {
        const newMessages = snapshot
          .docChanges()
          .filter(
            change => change.type === 'added' || change.type === 'modified',
          )
          .map(change => ({
            id: change.doc.id,
            ...change.doc.data(),
          })) as ChatMessage[]
        callback(newMessages)
      },
      error => {
        console.warn(`subscribeChatMessages_error: ${roomId}`, error)
      },
    )
  },
  subscribeChatMessagesByTime: (
    roomId: string,
    lastMessageAt: ServerTime | Date | number | null | undefined,
    callback: (docs: ChatMessage[]) => void,
  ) => {
    if (!roomId) return () => {}
    const messagesRef = collection(firestore, 'chats', roomId, 'messages')

    // createdAt 기준 필터링 시에는 해당 필드에 대한 orderBy가 필수임
    const messageQuery = query(
      messagesRef,
      orderBy('createdAt', 'asc'),
      where('createdAt', '>', lastMessageAt || new Date(0)),
    )

    return firebaseObserver(
      `messageRemote.subscribeChatMessagesByTime_${roomId}`,
      messageQuery,
      snapshot => {
        const newMessages = snapshot.docs.map(messageDoc => ({
          id: messageDoc.id,
          ...messageDoc.data(),
        })) as ChatMessage[]
        callback(newMessages)
      },
      error => {
        console.warn(`subscribeChatMessagesByTime_error: ${roomId}`, error)
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
    message: SendChatMessagePayload,
  ): Promise<SendChatMessageResult> => {
    return firebaseCall('messageRemote.sendChatMessage', async () => {
      const chatRef = doc(firestore, 'chats', roomId)
      // 클라이언트 메시지 ID를 우선 사용하고, 없으면 Firestore Auto ID를 생성
      let msgRef = null
      if (message.id) {
        msgRef = doc(firestore, 'chats', roomId, 'messages', message.id)
      } else {
        msgRef = doc(collection(firestore, 'chats', roomId, 'messages'))
      }

      //여러 명이 동시에 채팅을 칠 때 단순히 addDoc으로 넣으면 네트워크 속도에 따라 메시지 순서가 뒤죽박죽됨
      return await runTransaction(firestore, async tx => {
        // 신규 전송은 클라이언트에서 생성한 새 ID를 사용하므로 메시지 문서를 조회하지 않음
        const chatSnap = await tx.get(chatRef)
        if (!chatSnap.exists()) throw new Error('채팅방이 존재하지 않습니다.')

        return writeNewChatMessage(
          tx,
          chatRef,
          msgRef,
          chatSnap.data(),
          message,
        )
      })
    })
  },
  retryChatMessage: (
    roomId: string,
    message: SendChatMessagePayload,
  ): Promise<SendChatMessageResult> => {
    return firebaseCall('messageRemote.retryChatMessage', async () => {
      if (!message.id) throw new Error('재시도할 메시지 ID가 없습니다.')

      const chatRef = doc(firestore, 'chats', roomId)
      const msgRef = doc(
        firestore,
        'chats',
        roomId,
        'messages',
        message.id,
      )

      return await runTransaction(firestore, async tx => {
        const chatSnap = await tx.get(chatRef)
        if (!chatSnap.exists()) throw new Error('채팅방이 존재하지 않습니다.')

        // 재시도에서만 서버에 이미 등록된 동일 ID 메시지가 있는지 확인
        const existingMessageSnap = await tx.get(msgRef)
        if (existingMessageSnap.exists()) {
          const existingMessage = existingMessageSnap.data()
          const existingSeq = Number(existingMessage?.seq ?? 0)

          if (existingMessage?.senderId !== message.senderId) {
            throw new Error('동일한 메시지 ID가 이미 사용 중입니다.')
          }
          if (existingSeq <= 0) {
            throw new Error('기존 메시지의 seq가 유효하지 않습니다.')
          }

          return {
            id: msgRef.id,
            seq: existingSeq,
            alreadySent: true,
          }
        }

        return writeNewChatMessage(
          tx,
          chatRef,
          msgRef,
          chatSnap.data(),
          message,
        )
      })
    })
  },
}

const writeNewChatMessage = (
  tx: FirebaseFirestoreTypes.Transaction,
  chatRef: FirebaseFirestoreTypes.DocumentReference,
  msgRef: FirebaseFirestoreTypes.DocumentReference,
  chatData: FirebaseFirestoreTypes.DocumentData | undefined,
  message: SendChatMessagePayload,
): SendChatMessageResult => {
  const prev = Number(chatData?.lastSeq ?? 0)
  const next = prev + 1
  const now = serverTimestamp()
  const prevRecent = (chatData?.recentMessages as unknown[]) || []
  let updatedRecent = prevRecent

  if (message.text?.trim() || message.imageUrl || message.imageUrls?.length) {
    const namePrefix = message.senderName ? `[${message.senderName}]: ` : ''
    let content:
      | string
      | Array<
          | {type: 'text'; text: string}
          | {type: 'image_url'; image_url: {url: string}}
        > = message.text || ''

    if (message.imageUrls && message.imageUrls.length > 0) {
      content = [
        {type: 'text', text: `${namePrefix}${message.text || ''}`},
        ...message.imageUrls.slice(0, AI_IMAGE_LIMIT).map(url => ({
          type: 'image_url' as const,
          image_url: {url},
        })),
      ]
    } else if (message.imageUrl) {
      content = [
        {type: 'text', text: `${namePrefix}${message.text || ''}`},
        {type: 'image_url', image_url: {url: message.imageUrl}},
      ]
    } else {
      content = `${namePrefix}${content}`
    }

    updatedRecent = [
      ...prevRecent,
      {
        role: 'user',
        content,
      },
    ].slice(-10)
  }

  const newMessage = {
    seq: next,
    senderId: message.senderId,
    text: message.text ?? '',
    type: message.type,
    imageUrl: message.imageUrl ?? '',
    imageUrls: message.imageUrls ?? [],
    createdAt: now,
    senderPicURL: message.senderPicURL ?? null,
    senderName: message.senderName ?? null,
  }
  tx.set(msgRef, newMessage)
  tx.update(chatRef, {
    lastSeq: next,
    lastMessageAt: now,
    recentMessages: updatedRecent,
    lastMessage: {
      seq: next,
      text: newMessage.text,
      senderId: newMessage.senderId,
      createdAt: now,
      type: newMessage.type,
      imageUrl: newMessage.imageUrl,
      imageUrls: newMessage.imageUrls,
    },
  })

  return {
    id: msgRef.id,
    seq: next,
    alreadySent: false,
  }
}
