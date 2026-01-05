import {messageLocal} from '@app/features/chat/data/messageLocal.sqlite'
import {rebuildMessagePages} from '@app/features/chat/utils/message'
import {ChatMessage} from '@app/shared/types/chat'
import {ReactQueryPageType} from '@app/shared/types/react-quert'
import {InfiniteData, useMutation, useQueryClient} from '@tanstack/react-query'
type MessagesInfiniteData = InfiniteData<ReactQueryPageType<ChatMessage>>

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

export const useChatMessageDeleteMutation = (roomId?: string | null) => {
  const queryClient = useQueryClient()
  const queryKey = ['chatMessages', roomId]
  const deleteMutation = useMutation({
    // DB/API 작업은 여기서 (비동기 OK)
    mutationFn: async (messageId: string) => {
      if (!roomId) throw new Error('No RoomId')
      await messageLocal.deleteMessageById(roomId, messageId)
      return messageId
    },
    // UI 업데이트는 여기서 (동기적 처리 권장)
    onMutate: async messageId => {
      if (!roomId) return
      await queryClient.cancelQueries({queryKey})
      const prev = queryClient.getQueryData<MessagesInfiniteData>(queryKey)

      queryClient.setQueryData<MessagesInfiniteData>(queryKey, old => {
        if (!old) return old
        const allMsgs = old.pages.flatMap(p => p.data)
        const filtered = allMsgs.filter(m => m.id !== messageId)
        // 3. 페이지 재구성
        return rebuildMessagePages(filtered, old, 20)
      })

      return {prev}
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev)
    },
  })
  return deleteMutation
}
