import type {ChatMessage} from '@app/shared/types/chat'
import type {ReactQueryPageType} from '@app/shared/types/react-quert'
import {mergeMessages} from '@app/shared/utils/chat'
import type {InfiniteData} from '@tanstack/react-query'
import {useQueryClient} from '@tanstack/react-query'

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

export const useChatCache = (roomId?: string) => {
  const queryClient = useQueryClient()
  const queryKey = ['chatMessages', roomId]

  // 1️⃣ 메시지 추가 (Optimistic UI, 새 메시지 수신 등)
  const addMessages = (newMessages: ChatMessage[]) => {
    if (!roomId) return
    queryClient.setQueryData(
      ['chatMessages', roomId],
      (old: MessagesInfiniteData | undefined) => {
        const cur = old ?? init
        const merged = mergeMessages(cur.pages[0]?.data || [], newMessages)
        return {
          ...(old ?? init), //초기값이 없는 경우가 있음.
          pages: [{...cur.pages[0], data: merged}, ...cur.pages.slice(1)],
        }
      },
    )
  }

  // 2️⃣ 메시지 상태 업데이트 (pending -> success / fail)
  // 아까 sendChatMessage 성공했을 때 쓸 녀석!
  const updateMessageStatus = (
    messageId: string,
    status: 'success' | 'fail' | 'pending',
  ) => {
    if (!roomId) return
    queryClient.setQueryData(
      queryKey,
      (old: MessagesInfiniteData | undefined) => {
        if (!old) return old
        const newPages = old.pages.map(page => ({
          ...page,
          data: page.data.map(msg =>
            msg.id === messageId ? {...msg, status} : msg,
          ),
        }))
        return {
          ...old,
          pages: newPages,
        }
      },
    )
  }

  return {addMessages, updateMessageStatus}
}
