import {messageLocal} from '@app/features/chat/data/messageLocal.sqlite'
import {messageService} from '@app/features/chat/service/messageService'
import {usePerformanceMeasure} from '@app/shared/hooks/usePerformanceMeasure'
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

export const useChatMessagesInfinite = (roomId: string | null | undefined) => {
  const queryClient = useQueryClient()
  const queryKey = ['chatMessages', roomId]

  const queryResult = useInfiniteQuery({
    enabled: !!roomId,
    queryKey,
    queryFn: async ({pageParam}: {pageParam?: number}) => {
      try {
        if (!roomId) return initChatPage
        // 성능측정용
        // await fetchMessageWithMeasure(roomId, pageParam)
        const seq = pageParam
        const localMessages = (await messageLocal.getChatMessagesBySeq(
          roomId,
          seq, //마지막 채팅의 SEQ 값
          PAGE_SIZE,
        )) as ChatMessage[]
        //첫 데이터 조회거나, 로컬데이터가 마지막이 아닌 경우는 서버조회
        const shouldFetchFromServer = (localMessages?.length || 0) < PAGE_SIZE
        if (shouldFetchFromServer) {
          try {
            // CASE 1. 로컬에 없으면 Firestore에서 가져오기
            const {items: serverMessages} =
              await messageService.getChatMessagesFromSeq(
                roomId,
                seq,
                PAGE_SIZE,
              )

            //서버데이터가 있으면 그대로 sqlite에 push
            if (serverMessages?.length > 0)
              await messageLocal.saveMessagesToSQLite(roomId, serverMessages)
            //1. 데이터가 중복으로 들어오는경우가 있음, 다시조회하는 로직에서 REPLACE 및 정렬됨
            //2. 데이터를 일관되게 SQLITE를 바라보게해서, 유지보수성 증가
            const updatedMessages = await messageLocal.getChatMessagesBySeq(
              roomId,
              seq,
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
const fetchMessageWithMeasure = async (
  roomId: string,
  pageParam: number | undefined,
) => {
  const {measureAsync} = usePerformanceMeasure()
  const seq = pageParam

  // 1. SQLite 조회 성능 측정
  const localMessages = await measureAsync('FETCH_CHAT_MESSAGES', async () => {
    return (await messageLocal.getChatMessagesBySeq(
      roomId,
      seq,
      PAGE_SIZE,
    )) as ChatMessage[]
  })

  //첫 데이터 조회거나, 로컬데이터가 마지막이 아닌 경우는 서버조회
  const shouldFetchFromServer = (localMessages?.length || 0) < PAGE_SIZE
  if (shouldFetchFromServer) {
    try {
      // CASE 1. 로컬에 없으면 Firestore에서 가져오기
      // Firestore 조회 성능 측정
      const {items: serverMessages} = await measureAsync(
        'FIRESTORE_FETCH',
        () => messageService.getChatMessagesFromSeq(roomId, seq, PAGE_SIZE),
      )

      //서버데이터가 있으면 그대로 sqlite에 push
      if (serverMessages?.length > 0) {
        // 3. SQLite 저장 성능 측정
        await measureAsync('SQLITE_SAVE', () =>
          messageLocal.saveMessagesToSQLite(roomId, serverMessages),
        )
      }

      //다시 조회 (저장 후 SQLite 데이터를 바라보게함.)
      const updatedMessages = await measureAsync('FETCH_CHAT_MESSAGES', () =>
        messageLocal.getChatMessagesBySeq(roomId, seq),
      )
      return createPageResult(updatedMessages)
    } catch (e) {
      return createPageResult(localMessages)
    }
  }
}
