import {messageLocal} from '@app/features/chat/data/messageLocal.sqlite'
import {messageService} from '@app/features/chat/service/messageService'
import {ChatMessage} from '@app/shared/types/chat'
import {useInfiniteQuery, useQueryClient} from '@tanstack/react-query'

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
    lastVisible: lastMsg?.seq ?? null,
    isLastPage: messages.length < PAGE_SIZE,
  }
}

export const useChatMessagesInfinite = (
  roomId: string | null | undefined,
  serverLastSeq?: number,
) => {
  const queryClient = useQueryClient()
  const queryKey = ['chatMessages', roomId]

  const queryResult = useInfiniteQuery({
    enabled: !!roomId,
    queryKey,
    queryFn: async ({pageParam}: {pageParam?: number}) => {
      try {
        if (!roomId) return initChatPage
        const seq = pageParam
        const messages = await messageService.getChatMessages(
          roomId,
          seq,
          PAGE_SIZE,
          serverLastSeq,
        )

        return createPageResult(messages)
      } catch (e) {
        // 모든 레이어에서 에러 발생 시 fallback
        return initChatPage
      }
    },
    getNextPageParam: lastPage => {
      return lastPage?.isLastPage ? undefined : lastPage?.lastVisible
    },
    initialPageParam: undefined,
    staleTime: 5000,
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
      await messageLocal.clearMessagesByChatRoomId(roomId)
      // 3. 채팅방 캐시제거
      await queryClient.resetQueries({queryKey: ['chatMessages', roomId]})
    } catch (e) {
      console.log('resetChatMessages error:', e)
    }
  }

  return {
    ...queryResult,
    resetChatMessages,
  }
}

// Firebase + SQLite 조회 성능 측정할떄 쓰기
// const fetchMessageWithMeasure = async (
//   roomId: string,
//   pageParam: number | undefined,
// ) => {
//   // CRUD 작업이나 비동기 함수의 성능(Latency)을 측정하기 위한 커스텀 훅
//   // const {measureAsync} = usePerformanceMeasure()
//   const {measureAsync} = {measureAsync: async (_k: string, fn: any) => await fn()} as any // 임시 우회
//   const seq = pageParam

//   // 1. 통합 조회 로직 수행 (성능 측정 포함)
//   const messages = await measureAsync('FETCH_CHAT_MESSAGES_TOTAL', async () => {
//     return await messageService.getChatMessages(roomId, seq, PAGE_SIZE)
//   })

//   return createPageResult(messages)
// }
