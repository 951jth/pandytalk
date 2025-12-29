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

export const useChatMessagesInfinite = (roomId: string | null | undefined) => {
  const queryClient = useQueryClient()
  const queryKey = ['chatMessages', roomId]
  const queryResult = useInfiniteQuery({
    enabled: !!roomId,
    queryKey,
    queryFn: async ({pageParam}: {pageParam?: number}) => {
      //pageParam은 마지막 데이터
      try {
        if (!roomId) return initChatPage
        const ms = toMillisFromServerTime(pageParam)

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
              await messageService.getChatMessages(roomId, pageParam, PAGE_SIZE)

            //서버데이터가 있으면 그대로 sqlite에 push
            if (serverMessages.length > 0) {
              await messageLocal.saveMessagesToSQLite(roomId, serverMessages)
            }
            // ✅ 왜 서버에서 가져온 데이터를 그대로 리턴하지않고 sqlite에서 다시 조회하고 리턴하는가?
            // 1. 데이터 소스 일관성 유지
            // 2. SQLite 저장이 100% 성공했다는 보장 강화
            // 3. 중복/정렬 문제 예방 : serverMessages가 중복되있으면 오류발생
            const updatedMessages = await messageLocal.getChatMessagesByCreated(
              roomId,
              ms,
            )

            return {
              data: updatedMessages,
              lastVisible:
                updatedMessages[updatedMessages.length - 1]?.createdAt ?? null,
              isLastPage: updatedMessages.length < PAGE_SIZE,
            }
          } catch (e) {
            return {
              data: localMessages,
              lastVisible:
                localMessages?.[localMessages.length - 1]?.createdAt ?? null,
              isLastPage: localMessages.length < PAGE_SIZE,
            }
          }
        }
        // CASE 2. 로컬데이터가 충분히 있는 경우
        return {
          data: localMessages,
          lastVisible:
            localMessages?.[localMessages.length - 1]?.createdAt ?? null,
          isLastPage: localMessages.length < PAGE_SIZE,
        }
      } catch (e) {
        //로컬데이터 조차 가져오지 못하는 경우.
        //에러처리, 동일한 리턴값을 유지해야함
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
        console.log('🛑 Already refetching. Skipping reset.')
        return
      }
      // 2. SQLite 메시지 삭제
      // await clearMessagesFromSQLite(roomId)
      await messageLocal.clearAllMessages()
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
