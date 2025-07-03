import {getApp} from '@react-native-firebase/app'
import {
  collection,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
} from '@react-native-firebase/firestore'
import {useInfiniteQuery, useQuery, useQueryClient} from '@tanstack/react-query'
import {useEffect} from 'react'
import {
  getMessagesFromLatestRead,
  getMessagesFromSQLite,
  getMessagesFromSQLiteByPaging,
  saveMessagesToSQLite,
  subscribeToMessages,
} from '../../services/chatService'
import type {ChatMessage} from '../../types/firebase'

const firestore = getFirestore(getApp())
const PAGE_SIZE = 20

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
        const localMessages = (await getMessagesFromSQLite(
          roomId,
        )) as ChatMessage[]
        if (localMessages?.length > 0) {
          const latestCreated =
            localMessages[localMessages.length - 1]?.createdAt

          const unreadMessages = await getMessagesFromLatestRead(
            roomId,
            latestCreated,
          )
          const merged = mergeMessages(localMessages, unreadMessages)
          return merged
        }

        // 로컬에 없으면 Firestore에서 가져오기
        const messagesRef = collection(firestore, 'chats', roomId, 'messages')
        let q = query(messagesRef, orderBy('createdAt', 'desc'))

        const snapshot = await getDocs(q)
        const serverMessages: ChatMessage[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as ChatMessage[]
        await saveMessagesToSQLite(roomId, serverMessages)
        return serverMessages
      } catch (e) {}
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

export const useChatMessagesPaging = (roomId: string | null) => {
  const queryClient = useQueryClient()
  const queryKey = ['chatMessages', roomId]
  const queryResult = useInfiniteQuery({
    enabled: !!roomId,
    queryKey,
    queryFn: async ({pageParam}: {pageParam?: number}) => {
      try {
        if (!roomId) throw new Error('roomId is null')
        const localMessages = (await getMessagesFromSQLiteByPaging(
          roomId,
          pageParam, //pageParam은 여기서 마지막 읽은 날짜임
        )) as ChatMessage[]
        if (localMessages?.length > 0) {
          const latestCreated =
            localMessages[localMessages.length - 1]?.createdAt
          // 로컬 데이터의 마지막 날짜 확인
          // const unreadMessages = await getMessagesFromLatestRead(
          //   roomId,
          //   latestCreated,
          // )
          // const merged = mergeMessages(localMessages, unreadMessages)
          // console.log('local', merged)
          return {
            data: localMessages,
            lastVisible:
              localMessages?.[localMessages.length - 1]?.createdAt ?? null,
            isLastPage: localMessages.length < PAGE_SIZE,
          }
        }

        // 로컬에 없으면 Firestore에서 가져오기
        const messagesRef = collection(firestore, 'chats', roomId, 'messages')
        let q = query(
          messagesRef,
          orderBy('createdAt', 'desc'),
          limit(PAGE_SIZE),
        )
        if (pageParam) q = query(q, startAfter(pageParam))

        const snapshot = await getDocs(q)
        const serverMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as ChatMessage[]
        await saveMessagesToSQLite(roomId, serverMessages)
        console.log('server', serverMessages)
        return {
          data: serverMessages,
          lastVisible:
            serverMessages?.[serverMessages?.length - 1]?.createdAt ?? null,
          isLastPage: serverMessages?.length < PAGE_SIZE, //마지막 페이지 유무
        }
      } catch (e) {
        console.error('chat paging', e)
        return {
          data: [] as ChatMessage[],
          lastVisible: null,
          isLastPage: true,
        }
      }
    },
    getNextPageParam: lastPage => {
      console.log('lastPage', lastPage)
      return lastPage?.isLastPage ? undefined : lastPage?.lastVisible
    },
    initialPageParam: undefined,
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

//메세지 중복 제거 및 병합
function mergeMessages(
  existing: ChatMessage[],
  incoming: ChatMessage[],
): ChatMessage[] {
  const map = new Map<string, ChatMessage>()
  ;[...existing, ...incoming].forEach(msg => map.set(msg.id, msg))
  return Array.from(map.values()).sort((a, b) => a.createdAt - b.createdAt)
}
