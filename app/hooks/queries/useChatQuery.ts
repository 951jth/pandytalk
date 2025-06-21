import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from '@react-native-firebase/firestore'
import {useQuery, useQueryClient} from '@tanstack/react-query'
import {firestore} from '../../store/firestore'
import {db} from '../../store/sqlite'
import type {ChatMessage} from '../../types/firebase'

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

export const useChatMessages = (roomId: string) => {
  const queryClient = useQueryClient()

  const queryKey = ['chatMessages', roomId]

  const queryResult = useQuery({
    queryKey,
    queryFn: () => getMessagesFromSQLite(roomId),
    staleTime: Infinity,
    refetchOnMount: false,
  })

  // 실시간 구독 및 SQLite 저장
  // useEffect(() => {
  //   const unsubscribe = listenToMessages(roomId, messages => {
  //     saveMessagesToSQLite(roomId, messages)
  //     queryClient.setQueryData(queryKey, messages)
  //   })

  //   return () => unsubscribe()
  // }, [roomId])``
  return queryResult
}

export const saveMessagesToSQLite = async (
  roomId: string,
  messages: ChatMessage[],
) => {
  const tx = db.transaction(tx => {
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
  })

  await tx
}

export const getMessagesFromSQLite = async (
  roomId: string,
): Promise<ChatMessage[]> => {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM messages WHERE roomId = ? ORDER BY createdAt DESC',
        [roomId],
        (_, {rows}) => {
          const data: ChatMessage[] = []
          for (let i = 0; i < rows.length; i++) {
            data.push(rows.item(i))
          }
          resolve(data)
        },
        (_, error) => {
          reject(error)
          return false
        },
      )
    })
  })
}
