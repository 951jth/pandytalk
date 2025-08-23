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
  where,
} from '@react-native-firebase/firestore'
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import {useEffect} from 'react'
import {
  clearMessagesFromSQLite,
  getLatestMessageCreatedAtFromSQLite,
  getMessagesFromLatestRead,
  getMessagesFromSQLiteByPaging,
  saveMessagesToSQLite,
} from '../../services/chatService'
import type {ChatMessage} from '../../types/chat'
import {mergeMessages} from '../../utils/chat'

type MessagePage = {
  data: ChatMessage[]
  hasNext: boolean
  nextCursor?: string
}

// ✅ 올바른 타입: Infinite Query용
type MessagesInfiniteData = InfiniteData<MessagePage>

const firestore = getFirestore(getApp())
const PAGE_SIZE = 20

//채팅 메세지 조회 (실시간 들어오는 메세지)
export const listenToMessages = (
  roomId: string,
  onUpdate: (messages: ChatMessage[]) => void,
) => {
  // const messagesRef = collection(firestore, 'chats', roomId, 'messages')
  const lastCreatedAt = getLatestMessageCreatedAtFromSQLite(roomId)

  const q = query(
    collection(firestore, 'chats', roomId, 'messages'),
    orderBy('createdAt'),
    startAfter(lastCreatedAt),
  )

  const unsubscribe = onSnapshot(q, snapshot => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ChatMessage[]
    onUpdate(messages)
  })

  return unsubscribe
}

export const useChatMessagesPaging = (roomId: string | null) => {
  const queryClient = useQueryClient()
  const pageSize = 20
  const queryKey = ['chatMessages', roomId]
  const queryResult = useInfiniteQuery({
    enabled: !!roomId,
    queryKey,
    queryFn: async ({pageParam}: {pageParam?: number}) => {
      try {
        if (!roomId)
          return {
            data: [] as ChatMessage[],
            lastVisible: undefined,
            isLastPage: true,
          }
        const localMessages = (await getMessagesFromSQLiteByPaging(
          roomId,
          pageParam, //pageParam은 여기서 마지막 읽은 날짜임
        )) as ChatMessage[]
        if (localMessages.length < pageSize) {
          console.log('on server load cursor: ', pageParam)
          // CASE 1. 로컬에 없으면 Firestore에서 가져오기
          const messagesRef = collection(firestore, 'chats', roomId, 'messages')
          let q = query(
            messagesRef,
            orderBy('createdAt', 'desc'),
            limit(PAGE_SIZE),
          )
          if (pageParam) q = query(q, where('createdAt', '<', pageParam))

          const snapshot = await getDocs(q)
          const serverMessages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as ChatMessage[]
          if (serverMessages.length > 0) {
            //서버데이터가 있으면 그대로 sqlite에 push
            await saveMessagesToSQLite(roomId, serverMessages)
            // ✅ 왜 서버에서 가져온 데이터를 그대로 리턴하지않고 sqlite에서 다시 조회하고 리턴하는가?
            // 1. 데이터 소스 일관성 유지
            // 2. SQLite 저장이 100% 성공했다는 보장 강화
            // 3. 중복/정렬 문제 예방 : serverMessages가 중복되있으면 오류발생
            const updatedMessages = await getMessagesFromSQLiteByPaging(
              roomId,
              pageParam,
            )
            return {
              data: updatedMessages,
              lastVisible:
                updatedMessages[updatedMessages.length - 1]?.createdAt ?? null,
              isLastPage: updatedMessages.length < PAGE_SIZE,
            }
          }
        } else {
          console.log('localMessages', localMessages)
          // CASE 2. 로컬데이터가 충분히 있는 경우
          return {
            data: localMessages,
            lastVisible:
              localMessages?.[localMessages.length - 1]?.createdAt ?? null,
            isLastPage: localMessages.length < PAGE_SIZE,
          }
        }
      } catch (e) {
        //에러처리, 동일한 리턴값을 유지해야함
        return {
          data: [] as ChatMessage[],
          lastVisible: null,
          isLastPage: true,
        }
      }
    },
    getNextPageParam: lastPage => {
      return lastPage?.isLastPage ? undefined : lastPage?.lastVisible
    },
    initialPageParam: undefined,
    staleTime: 5000,
    refetchOnMount: false,
  })

  const resetChatMessages = async () => {
    if (!roomId) return
    try {
      // 1. 현재 해당 쿼리가 fetching 중인지 확인
      const isFetching = queryClient.isFetching({queryKey}) > 0
      if (isFetching) {
        console.log('🛑 Already refetching. Skipping reset.')
        return
      }
      // 2. SQLite 메시지 삭제
      await clearMessagesFromSQLite(roomId)
      // 3. React Query 캐시 제거
      await queryClient.invalidateQueries({
        queryKey,
        refetchType: 'active',
      })
    } catch (e) {
      console.log('e', e)
    }
  }

  return {
    ...queryResult,
    resetChatMessages,
  }
}

export const useSubscriptionMessage = (
  roomId: string | null | undefined,
  lastCreatedAt: number | null | undefined,
) => {
  const db = getFirestore(getApp()) // ✅ 훅 밖에서 선언되더라도 안전
  const queryClient = useQueryClient() // ✅ 항상 호출되도록

  useEffect(() => {
    if (!roomId || lastCreatedAt == null) return
    const messagesRef = collection(db, 'chats', roomId, 'messages')
    let q = query(messagesRef, orderBy('createdAt', 'desc'))

    if (lastCreatedAt) q = query(q, where('createdAt', '>', lastCreatedAt))

    const unsubscribe = onSnapshot(q, async snapshot => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ChatMessage[]
      if (newMessages.length > 0) {
        await saveMessagesToSQLite(roomId, newMessages)

        queryClient.setQueryData(
          ['chatMessages', roomId],
          (old: MessagesInfiniteData | undefined) => {
            if (!old) return
            const merged = mergeMessages(old.pages[0].data, newMessages)
            return {
              ...old,
              pages: [{...old.pages[0], data: merged}, ...old.pages.slice(1)],
            }
          },
        )
      }
    })

    return () => unsubscribe()
  }, [roomId, lastCreatedAt])
}

// 채팅방 데이터 최신화 (현재 snapshot으로 대체함 안씀)
export const useSyncUnreadMessages = (
  roomId: string | null,
  localMessages: ChatMessage[],
) => {
  const latestCreatedAt = localMessages?.[0]?.createdAt
  const isSyncEnabled =
    !!roomId && localMessages.length > 0 && !!latestCreatedAt
  return useQuery({
    queryKey: ['unreadMessagesSync', roomId],
    queryFn: async () => {
      const unread = await getMessagesFromLatestRead(roomId!, latestCreatedAt)
      // console.log('unread', unread)
      return [...unread, ...localMessages]
      // return mergeMessages(unread, localMessages)
    },
    enabled: isSyncEnabled,
    staleTime: 0, // ✅ 캐시된 데이터는 즉시 stale 처리됨
    refetchOnMount: true,
    refetchOnWindowFocus: true, // ✅ 포커스 복귀 시 자동 동기화
  })
}
