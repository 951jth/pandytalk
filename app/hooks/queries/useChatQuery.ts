import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
} from '@react-native-firebase/firestore'
import {useQuery, useQueryClient} from '@tanstack/react-query'
import {useEffect} from 'react'
import type {Transaction} from 'react-native-sqlite-storage'
import {subscribeToMessages} from '../../services/chatService'
import {firestore} from '../../store/firestore'
import {db} from '../../store/sqlite'
import type {ChatMessage} from '../../types/firebase'

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
      if (!roomId) throw new Error('roomId is null')
      const localMessages = await getMessagesFromSQLite(roomId)

      if (localMessages.length > 0) return localMessages

      // 로컬에 없으면 Firestore에서 가져오기
      const messagesRef = collection(firestore, 'chats', roomId, 'messages')
      const q = query(messagesRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)

      const serverMessages: ChatMessage[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ChatMessage[]

      await saveMessagesToSQLite(roomId, serverMessages)
      return serverMessages
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
export const saveMessagesToSQLite = async (
  roomId: string,
  messages: ChatMessage[],
): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx: Transaction) => {
        messages.forEach(msg => {
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
          return false
        },
      )
    })
  })
}
