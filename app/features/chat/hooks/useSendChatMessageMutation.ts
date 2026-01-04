import {messageService} from '@app/features/chat/service/messageService'
import type {ChatListItem, ChatMessage} from '@app/shared/types/chat'
import type {ReactQueryPageType} from '@app/shared/types/react-quert'
import {mergeMessages} from '@app/shared/utils/chat'
import {convertTimestampsToMillis} from '@app/shared/utils/firebase'
import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'

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

export type InputMessageParams = {
  text: string
  type: ChatMessage['type']
  imageUrl?: string
}

export const useSendChatMessageMutation = (
  roomInfo: ChatListItem | null | undefined,
) => {
  const queryClient = useQueryClient()
  const roomId = roomInfo?.id
  const queryKey = ['chatMessages', roomId]

  // 메시지 추가 (Optimistic UI, 새 메시지 수신 등)
  const addMessages = (newMessages: ChatMessage[]) => {
    if (!roomId) return
    queryClient.setQueryData(
      ['chatMessages', roomId],
      (old: MessagesInfiniteData | undefined) => {
        const cur = old ?? init
        const merged = mergeMessages(cur.pages[0]?.data || [], newMessages)
        console.log('merged messages:', merged)
        return {
          ...(old ?? init), //초기값이 없는 경우가 있음.
          pages: [{...cur.pages[0], data: merged}, ...cur.pages.slice(1)],
        }
      },
    )
  }

  // 메시지 상태 업데이트 (pending -> success / fail)
  const updateMessageStatus = (
    messageId: string,
    status: ChatMessage['status'],
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
        console.log('newPages', newPages)
        return {
          ...old,
          pages: newPages,
        }
      },
    )
  }
  const mutation = useMutation({
    mutationFn: async (message: ChatMessage) => {
      await messageService.sendChatMessage({roomInfo, message})
      return true
    },
    onMutate: async message => {
      if (!roomId) return
      // 1) 진행 중인 refetch 있으면 취소 (경합 줄임)
      await queryClient.cancelQueries({queryKey})
      // 2) 이전 스냅샷 저장
      const prev = queryClient.getQueryData<MessagesInfiniteData>(queryKey)
      const msgs = [
        {...convertTimestampsToMillis(message), status: 'pending'},
      ] as ChatMessage[]
      console.log('msgs onMutate:', msgs)
      addMessages(msgs)
      return {prev, optimisticId: message.id}
    },

    onSuccess: (_res, _message, ctx) => {
      if (!roomId || !ctx?.optimisticId) return
      updateMessageStatus(ctx.optimisticId, 'pending')
    },

    onError: (err, _message, ctx) => {
      console.error('sendChatMessage_error:', err)
      if (!roomId) return
      if (ctx?.optimisticId) updateMessageStatus(ctx.optimisticId, 'failed')
    },
  })

  return {...mutation, addMessages, updateMessageStatus}
}
