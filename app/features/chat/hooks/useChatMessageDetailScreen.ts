import {messageService} from '@app/features/chat/service/messageService'
import type {ReactQueryPageType} from '@app/features/chat/types/react-query'
import type {AppRouteParamList} from '@app/navigation/types'
import type {ChatMessage} from '@app/shared/types/chat'
import {formatChatTime, formatServerDate} from '@app/shared/utils/format'
import {useAppSelector} from '@app/store/reduxHooks'
import {useRoute, type RouteProp} from '@react-navigation/native'
import {
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import {useMemo} from 'react'

type ChatMessageDetailRoute = RouteProp<
  AppRouteParamList,
  'chat-message-detail'
>

export const useChatMessageDetailScreen = () => {
  const route = useRoute<ChatMessageDetailRoute>()
  const queryClient = useQueryClient()
  const {data: user} = useAppSelector(state => state.user)
  const {roomId, messageId} = route.params
  const cachedMessage = useMemo(() => {
    const cached = queryClient.getQueryData<
      InfiniteData<ReactQueryPageType<ChatMessage>>
    >(['chatMessages', roomId])

    return cached?.pages
      .flatMap(page => page.data)
      .find(message => message.id === messageId)
  }, [messageId, queryClient, roomId])

  const messageQuery = useQuery({
    queryKey: ['chatMessage', roomId, messageId],
    enabled: !!roomId && !!messageId,
    queryFn: () => messageService.getChatMessage(roomId, messageId),
    initialData: cachedMessage,
    staleTime: Infinity,
  })

  const message = messageQuery.data
  const isMine = message?.senderId === user?.uid
  const senderName = message?.senderName || (isMine ? '나' : '알 수 없음')
  const formattedDate = useMemo(() => {
    if (!message) return ''

    const date = formatServerDate(message.createdAt, 'YYYY년 MM월 DD일')
    const time = formatChatTime(message.createdAt)
    return `${date} ${time}`.trim()
  }, [message])

  return {
    ...messageQuery,
    message,
    isMine,
    senderName,
    formattedDate,
  }
}
