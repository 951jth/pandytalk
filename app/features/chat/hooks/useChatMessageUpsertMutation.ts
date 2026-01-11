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

type SendChatParams = {
  message: ChatMessage
  createdRoomId?: string | null
}

export const useChatMessageUpsertMutation = (
  roomId: string | null | undefined,
) => {
  const queryClient = useQueryClient()
  const queryKey = ['chatMessages', roomId]

  // 메시지 추가
  const addMessages = (newMessages: ChatMessage[], createdRoomId?: string) => {
    const rid = createdRoomId ?? roomId
    if (!rid) throw new Error('채팅방이 존재하지 않습니다.')
    queryClient.setQueryData(
      ['chatMessages', rid],
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
    key: readonly unknown[],
    message: ChatMessage,
    status: ChatMessage['status'],
  ) => {
    queryClient.setQueryData<MessagesInfiniteData>(key, old => {
      const base = old ?? init
      const newPages = base.pages.map(page => ({
        ...page,
        data: page.data.map(msg =>
          msg.id === message?.id ? {...message, status} : msg,
        ),
      }))
      return {
        ...base,
        pages: newPages,
      }
    })
    messageLocal.getAllMessages().then(res => {
      console.log('all msgs: ', res)
    })
  }
  // 메시지 삭제
  const deleteMessage = async (messageId: string) => {
    if (!roomId) throw new Error('채팅방이 존재하지 않습니다.')
    queryClient.setQueryData(
      queryKey,
      async (old: MessagesInfiniteData | undefined) => {
        if (!old) return old
        const flat =
          (old ?? init)?.pages.flatMap(page => page?.data ?? []) ?? []
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
    mutationFn: async ({message, createdRoomId}: SendChatParams) => {
      const rid = createdRoomId ?? roomId
      if (!rid) throw new Error('채팅방이 존재하지 않습니다.')
      await messageService.sendChatMessage({roomId: rid, message})
      return true
    },

    onMutate: async ({message, createdRoomId}: SendChatParams) => {
      const rid = createdRoomId ?? roomId
      if (!rid) return

      const key = ['chatMessages', rid] // ✅ roomId 바뀔 수 있으니 key도 rid 기준
      await queryClient.cancelQueries({queryKey: key})

      const prev = queryClient.getQueryData<MessagesInfiniteData>(key)
      const msgs = [
        {...convertTimestampsToMillis(message), status: 'pending'},
      ] as ChatMessage[]
      addMessages(msgs, rid)
      //방이 없음 -> 생성되는 경우 key값이 바뀌므로 전달해줘야함
      return {prev, optimistic: message, createdRoomId: rid, key}
    },
    // 성공 시 onSnapshot에서 데이터를 내려주기떄문에 별도의 설정하지않음.
    // onSuccess: (data, message, ctx) => {
    //   if (!ctx?.optimistic?.id) return
    //   updateMessageStatus(ctx.key, ctx.optimistic, 'success')
    // },

    onError: (err, message, ctx) => {
      if (ctx?.optimistic?.id)
        updateMessageStatus(ctx.key, ctx.optimistic, 'failed')
    },
  })

  return {...mutation, addMessages, updateMessageStatus, deleteMessage}
}
