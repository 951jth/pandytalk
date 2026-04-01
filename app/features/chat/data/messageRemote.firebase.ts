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
  where,
} from '@react-native-firebase/firestore'
import * as Updates from 'expo-updates'

export const messageRemote = {
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
  subscribeChatMessages: (
    roomId: string,
    lastSeq: number | null | undefined,
    callback: (docs: ChatMessage[]) => void,
  ) => {
    if (!roomId) return () => {}
    console.log('현재 앱 채널:', Updates.channel)
    const messagesRef = collection(firestore, 'chats', roomId, 'messages')
    const messageQuery = query(
      messagesRef,
      orderBy('seq', 'asc'),
      where('seq', '>', lastSeq ?? 0),
    )

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
        // 1) 현재 채팅방 데이터 가져오기
        const chatSnap = await tx.get(chatRef)
        const chatData = chatSnap.data()
        const prev = Number(chatData?.lastSeq ?? 0)
        const next = prev + 1
        const now = serverTimestamp()

        // 2) AI 맥락(Context) 업데이트 로직 추가
        const prevRecent = (chatData?.recentMessages as any[]) || []
        let updatedRecent = prevRecent

        // 텍스트가 있는 경우에만 맥락에 추가
        if (message.text?.trim()) {
          const newContextItem = {
            role: 'user',
            content: message.text,
          }
          // 최신 10개만 유지
          updatedRecent = [...prevRecent, newContextItem].slice(-10)
        }

        // 3) 메시지 문서 작성
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

        // 4) 채팅방 갱신
        tx.update(chatRef, {
          lastSeq: next,
          lastMessageAt: now,
          recentMessages: updatedRecent, // 맥락 업데이트
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
