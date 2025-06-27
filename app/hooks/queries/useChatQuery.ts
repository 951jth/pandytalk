import {getApp} from '@react-native-firebase/app'
import {
  collection,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
} from '@react-native-firebase/firestore'
import {useQuery, useQueryClient} from '@tanstack/react-query'
import {useEffect} from 'react'
import {
  getMessagesFromSQLite,
  saveMessagesToSQLite,
  subscribeToMessages,
} from '../../services/chatService'
import type {ChatMessage} from '../../types/firebase'

const firestore = getFirestore(getApp())

//채팅 메세지 조회
export const listenToMessages = (
  roomId: string,
  onUpdate: (messages: ChatMessage[]) => void,
) => {
  const messagesRef = collection(firestore, 'chats', roomId, 'messages')
  const q = query(messagesRef, orderBy('createdAt', 'desc'))

  const unsubscribe = onSnapshot(q, snapshot => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ChatMessage[]
    onUpdate(messages)
  })

  return unsubscribe
}

export const useChatMessages = (roomId: string | null) => {
  const queryClient = useQueryClient()
  const queryKey = ['chatMessages', roomId]

  // ✅ React Query - SQLite or Firestore 최초 조회
  const queryResult = useQuery<ChatMessage[]>({
    enabled: !!roomId,
    queryKey,
    queryFn: async () => {
      try {
        if (!roomId) throw new Error('roomId is null')
        const localMessages = await getMessagesFromSQLite(roomId)
        console.log('localMessages', localMessages)
        if (localMessages?.length > 0) return localMessages

        // 로컬에 없으면 Firestore에서 가져오기
        const messagesRef = collection(firestore, 'chats', roomId, 'messages')
        const q = query(messagesRef, orderBy('createdAt', 'desc'))
        const snapshot = await getDocs(q)
        console.log('snapshot', snapshot)
        const serverMessages: ChatMessage[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as ChatMessage[]
        console.log('serverMessages', serverMessages)
        await saveMessagesToSQLite(roomId, serverMessages)
        return serverMessages
      } catch (e) {
        return []
      }
    },
    staleTime: Infinity,
    refetchOnMount: false,
  })

  // ✅ 실시간 구독: 변경 시 SQLite 저장 + 캐시 업데이트
  useEffect(() => {
    if (!roomId) return
    const unsubscribe = subscribeToMessages(roomId, async msgs => {
      await saveMessagesToSQLite(roomId, msgs)
      queryClient.setQueryData(queryKey, msgs)
    })

    return () => {
      unsubscribe()
    }
  }, [roomId])

  return queryResult
}
