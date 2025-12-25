import {getApp} from '@react-native-firebase/app'
import {
  collection,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from '@react-native-firebase/firestore'
import {
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import {useEffect} from 'react'

import {chatService} from '@app/features/chat/service/chatService'
import {ChatMessage} from '@app/shared/types/chat'
import {
  clearMessagesFromSQLite,
  getMessagesFromSQLiteByPaging,
  saveMessagesToSQLite,
} from '../../../db/sqlite'
import {mergeMessages} from '../../../shared/utils/chat'
import {
  toMillisFromServerTime,
  toRNFTimestamp,
} from '../../../shared/utils/firebase'

// ✅ 올바른 타입: Infinite Query용
type MessagesPage = {
  data: ChatMessage[]
  lastVisible: number | null // 다음 커서(ms). ServerTime 금지
  isLastPage: boolean
}

type MessagesInfiniteData = InfiniteData<MessagesPage>

const firestore = getFirestore(getApp())
const PAGE_SIZE = 20

export const useChatMessagesPaging = (roomId: string | null) => {
  const queryClient = useQueryClient()
  const queryKey = ['chatMessages', roomId]
  const queryResult = useInfiniteQuery({
    enabled: !!roomId,
    queryKey,
    queryFn: async ({pageParam}: {pageParam?: number}) => {
      //pageParam은 마지막 데이터
      try {
        if (!roomId)
          return {
            data: [] as ChatMessage[],
            lastVisible: null,
            isLastPage: true,
          }
        const ms = toMillisFromServerTime(pageParam)

        const localMessages = (await getMessagesFromSQLiteByPaging(
          roomId,
          ms, //pageParam은 여기서 마지막 읽은 날짜임
          PAGE_SIZE,
        )) as ChatMessage[]
        if (localMessages?.length || 0 < PAGE_SIZE) {
          // CASE 1. 로컬에 없으면 Firestore에서 가져오기
          const serverMessages = await chatService.getChatMessages(
            roomId,
            pageParam,
            PAGE_SIZE,
          )

          if (serverMessages.length > 0) {
            //서버데이터가 있으면 그대로 sqlite에 push
            await saveMessagesToSQLite(roomId, serverMessages)
            // ✅ 왜 서버에서 가져온 데이터를 그대로 리턴하지않고 sqlite에서 다시 조회하고 리턴하는가?
            // 1. 데이터 소스 일관성 유지
            // 2. SQLite 저장이 100% 성공했다는 보장 강화
            // 3. 중복/정렬 문제 예방 : serverMessages가 중복되있으면 오류발생
            const updatedMessages = await getMessagesFromSQLiteByPaging(
              roomId,
              ms,
            )
            return {
              data: updatedMessages,
              lastVisible:
                updatedMessages[updatedMessages.length - 1]?.createdAt ?? null,
              isLastPage: updatedMessages.length < PAGE_SIZE,
            }
          }
        } else {
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
      console.log('resetChatMessages error:', e)
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
  // const db = getFirestore(getApp()) // ✅ 훅 밖에서 선언되더라도 안전
  const queryClient = useQueryClient() // ✅ 항상 호출되도록
  useEffect(() => {
    if (!roomId) return
    const messagesRef = collection(firestore, 'chats', roomId, 'messages')
    let q = query(messagesRef, orderBy('createdAt', 'desc'), limit(50))
    const ts = toRNFTimestamp(lastCreatedAt)
    const init: MessagesInfiniteData = {
      pages: [
        {
          data: [] as ChatMessage[],
          lastVisible: null, // 쓰지 않으면 null
          isLastPage: true, // 초기엔 true로 둬도 무방
        },
      ],
      pageParams: [undefined],
    }
    if (ts) q = query(q, where('createdAt', '>', ts))

    const unsubscribe = onSnapshot(q, async snapshot => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ChatMessage[]
      if (newMessages.length > 0) {
        try {
          await saveMessagesToSQLite(roomId, newMessages)
          queryClient.setQueryData(
            ['chatMessages', roomId],
            (old: MessagesInfiniteData | undefined) => {
              const cur = old ?? init
              const merged = mergeMessages(
                cur.pages[0]?.data || [],
                newMessages,
              )
              return {
                ...(old ?? init),
                pages: [{...cur.pages[0], data: merged}, ...cur.pages.slice(1)],
              }
            },
          )
        } catch (e) {
          console.log('useSubscriptionMessage setQueryData error:', e)
          return init
        } finally {
          return init
        }
      }
    })

    return () => unsubscribe()
  }, [roomId, lastCreatedAt])
}
