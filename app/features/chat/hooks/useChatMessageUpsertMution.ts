import {messageLocal} from '@app/features/chat/data/messageLocal.sqlite'
import {messageService} from '@app/features/chat/service/messageService'
import {rebuildMessagePages} from '@app/features/chat/utils/message'
import type {ChatMessage} from '@app/shared/types/chat'
import type {ReactQueryPageType} from '@app/shared/types/react-quert'
import {mergeMessages} from '@app/shared/utils/chat'
import {convertTimestampsToMillis} from '@app/shared/utils/firebase'
import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import {Alert} from 'react-native'

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
  roomId: string | null | undefined,
) => {
  const queryClient = useQueryClient()
  const queryKey = ['chatMessages', roomId]

  // 메시지 추가
  const addMessages = (newMessages: ChatMessage[]) => {
    if (!roomId) return
    queryClient.setQueryData(
      ['chatMessages', roomId],
      (old: MessagesInfiniteData | undefined) => {
        const cur = old ?? init
        //등록하는과정에서 id를 기준으로 replace됨
        const merged = mergeMessages(cur.pages[0]?.data || [], newMessages)
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
        return {
          ...old,
          pages: newPages,
        }
      },
    )
  }

  // 메시지 삭제
  const deleteMessage = async (messageId: string) => {
    if (!roomId) return
    queryClient.setQueryData(
      queryKey,
      async (old: MessagesInfiniteData | undefined) => {
        if (!old) return old
        const flat = old?.pages.flatMap(page => page?.data ?? []) ?? []
        await messageLocal.deleteMessageById(roomId, messageId)
        return rebuildMessagePages(
          flat.filter(e => e.id !== messageId),
          old,
          20,
        )
      },
    )
  }

  const mutation = useMutation({
    mutationFn: async (message: ChatMessage) => {
      if (!roomId) return
      await messageService.sendChatMessage({roomId, message})
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

      addMessages(msgs)
      return {prev, optimisticId: message.id}
    },

    onSuccess: (_res, _message, ctx) => {
      if (!roomId || !ctx?.optimisticId) return
      updateMessageStatus(ctx.optimisticId, 'success')
    },

    onError: (err, _message, ctx) => {
      if (!roomId) return
      Alert.alert('전송 오류', err?.message)
      if (ctx?.optimisticId) updateMessageStatus(ctx.optimisticId, 'failed')
    },
  })

  return {...mutation, addMessages, updateMessageStatus, deleteMessage}
}
