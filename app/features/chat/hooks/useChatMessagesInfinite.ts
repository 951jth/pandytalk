import {messageLocal} from '@app/features/chat/data/messageLocal.sqlite'
import {messageService} from '@app/features/chat/service/messageService'
import {ChatMessage} from '@app/shared/types/chat'
import {useInfiniteQuery, useQueryClient} from '@tanstack/react-query'
import {toMillisFromServerTime} from '../../../shared/utils/firebase'

const PAGE_SIZE = 20

const initChatPage = {
  data: [] as ChatMessage[],
  lastVisible: null,
  isLastPage: true,
}

const createPageResult = (messages: ChatMessage[]) => {
  const lastMsg = messages[messages.length - 1]
  return {
    data: messages,
    lastVisible: lastMsg?.createdAt ?? null,
    isLastPage: messages.length < PAGE_SIZE,
  }
}

export const useChatMessagesInfinite = (roomId: string | null | undefined) => {
  const queryClient = useQueryClient()
  const queryKey = ['chatMessages', roomId]
  const queryResult = useInfiniteQuery({
    enabled: !!roomId,
    queryKey,
    queryFn: async ({pageParam}: {pageParam?: number}) => {
      //pageParam은 마지막 데이터
      try {
        console.log('pageParam', pageParam)
        if (!roomId) return initChatPage
        const ms = toMillisFromServerTime(pageParam)
        console.log('ms', ms)
        const localMessages = (await messageLocal.getChatMessagesByCreated(
          roomId,
          ms, //pageParam은 여기서 마지막 읽은 날짜임
          PAGE_SIZE,
        )) as ChatMessage[]
        //첫 데이터 조회거나, 로컬데이터가 마지막이 아닌 경우는 서버조회
        const shouldFetchFromServer = (localMessages?.length || 0) < PAGE_SIZE

        if (shouldFetchFromServer) {
          try {
            // CASE 1. 로컬에 없으면 Firestore에서 가져오기
            const {items: serverMessages} =
              await messageService.getChatMessages(roomId, ms, PAGE_SIZE)

            //서버데이터가 있으면 그대로 sqlite에 push
            if (serverMessages.length > 0) {
              await messageLocal.saveMessagesToSQLite(roomId, serverMessages)
            }
            //1. 데이터가 중복으로 들어오는경우가 있음, 다시조회하는 로직에서 REPLACE 및 정렬됨
            //2. 데이터를 일관되게 SQLITE를 바라보게해서, 유지보수성 증가
            const updatedMessages = await messageLocal.getChatMessagesByCreated(
              roomId,
              ms,
            )
            return createPageResult(updatedMessages)
          } catch (e) {
            return createPageResult(localMessages)
          }
        }

        // CASE 2. 서버에러는 있지만 로컬데이터가 충분히 있는 경우
        return createPageResult(localMessages)
      } catch (e) {
        //로컬데이터 조차 가져오지 못하는 경우.
        return initChatPage
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
        return
      }
      // 2. SQLite 메시지 삭제
      await messageLocal.clearAllMessages()
      // 3. React Query 캐시 제거
      await queryClient.invalidateQueries({
        queryKey: ['chatMessages'],
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
