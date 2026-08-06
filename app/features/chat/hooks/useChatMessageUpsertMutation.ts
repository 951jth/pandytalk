import {messageService} from '@app/features/chat/service/messageService'
import type {ChatMessage} from '@app/shared/types/chat'
import type {ReactQueryPageType} from '@app/features/chat/types/react-query'
import {updateInfiniteQueryItems} from '@app/features/chat/utils/infiniteQuery'
import {mergeMessages} from '@app/shared/utils/chat'
import {convertTimestampsToMillis} from '@app/shared/utils/firebase'
import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import {useCallback} from 'react'

type MessagesInfiniteData = InfiniteData<ReactQueryPageType<ChatMessage>>

const init: MessagesInfiniteData = {
  pages: [
    {
      data: [] as ChatMessage[],
      lastVisible: null,
      isLastPage: true,
    },
  ],
  pageParams: [undefined],
}

export type InputMessageParams = {
  text: string
  type: ChatMessage['type']
  imageUrl?: string
  imageUrls?: string[]
}

type SendChatParams = {
  message: ChatMessage
  createdRoomId?: string | null
}

type MutationContext = {
  prev: MessagesInfiniteData | undefined
  optimistic: ChatMessage
  key: readonly [string, string]
}

export const useChatMessageUpsertMutation = (
  roomId: string | null | undefined,
) => {
  const queryClient = useQueryClient()
  // 메시지 영속화는 Service가 담당하고 여기서는 React Query 캐시만 갱신
  const mergeMessagesIntoCache = useCallback(
    (newMessages: ChatMessage[], createdRoomId?: string) => {
      const rid = createdRoomId ?? roomId
      if (!rid) throw new Error('채팅방이 존재하지 않습니다.')
      queryClient.setQueryData(
        ['chatMessages', rid],
        (old: MessagesInfiniteData | undefined) => {
          const cur = old ?? init
          // 등록하는 과정에서 id를 기준으로 mergeMessages 내에서 중복 제거 및 정렬됨
          const merged = mergeMessages(cur.pages[0]?.data || [], newMessages)
          return {
            ...(old ?? init),
            pages: [{...cur.pages[0], data: merged}, ...cur.pages.slice(1)],
          }
        },
      )
    },
    [queryClient, roomId],
  )

  // 메시지 상태 업데이트 (pending -> success / fail)
  const updateMessageStatus = useCallback(
    (
      key: readonly unknown[],
      messageId: string,
      status: ChatMessage['status'],
    ) => {
      queryClient.setQueryData<MessagesInfiniteData>(key, old => {
        const base = old ?? init
        return (
          updateInfiniteQueryItems(base, message => {
            if (message.id !== messageId) return message
            // 구독으로 확정된 success는 늦게 도착한 실패 결과로 되돌리지 않음
            if (message.status === 'success' && status === 'failed') {
              return message
            }
            return {...message, status}
          }) ?? base
        )
      })
    },
    [queryClient],
  )

  const handleMutate = useCallback(
    async ({message, createdRoomId}: SendChatParams) => {
      const rid = createdRoomId ?? roomId
      if (!rid) return

      const key = ['chatMessages', rid] as const
      await queryClient.cancelQueries({queryKey: key})

      const prev = queryClient.getQueryData<MessagesInfiniteData>(key)
      const optimisticMessages = [
        {...convertTimestampsToMillis(message), status: 'pending'},
      ] as ChatMessage[]
      mergeMessagesIntoCache(optimisticMessages, rid)

      return {prev, optimistic: message, key}
    },
    [roomId, queryClient, mergeMessagesIntoCache],
  )

  const handleSuccess = useCallback(
    async (_data: string, _params: SendChatParams, ctx?: MutationContext) => {
      if (!ctx?.optimistic.id) return

      updateMessageStatus(ctx.key, ctx.optimistic.id, 'success')
      // Service가 SQLite에 반영한 서버 seq를 캐시에 다시 동기화
      await queryClient.invalidateQueries({
        queryKey: ctx.key,
        refetchType: 'active',
      })
    },
    [queryClient, updateMessageStatus],
  )

  const handleError = useCallback(
    (err: Error, _params: SendChatParams, ctx?: MutationContext) => {
      console.warn('[chat] send message failed', err)
      if (ctx?.optimistic.id) {
        updateMessageStatus(ctx.key, ctx.optimistic.id, 'failed')
      }
    },
    [updateMessageStatus],
  )

  const mutation = useMutation<string, Error, SendChatParams, MutationContext>({
    mutationFn: async ({message, createdRoomId}) => {
      const rid = createdRoomId ?? roomId
      if (!rid) throw new Error('채팅방이 존재하지 않습니다.')
      return await messageService.sendChatMessage({roomId: rid, message})
    },
    onMutate: handleMutate,
    onSuccess: handleSuccess,
    onError: handleError,
  })

  const retryMutation = useMutation<
    string,
    Error,
    SendChatParams,
    MutationContext
  >({
    mutationFn: async ({message, createdRoomId}) => {
      const rid = createdRoomId ?? roomId
      if (!rid) throw new Error('채팅방이 존재하지 않습니다.')
      return await messageService.retryChatMessage({roomId: rid, message})
    },
    onMutate: handleMutate,
    onSuccess: handleSuccess,
    onError: handleError,
  })

  return {
    ...mutation,
    retryMessage: retryMutation.mutate,
    retryMessageAsync: retryMutation.mutateAsync,
    isRetryPending: retryMutation.isPending,
    mergeMessagesIntoCache,
    updateMessageStatus,
  }
}
