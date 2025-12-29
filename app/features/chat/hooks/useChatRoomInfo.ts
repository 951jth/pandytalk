import {chatService} from '@app/features/chat/service/chatService'
import type {ChatListItem} from '@app/shared/types/chat'
import {useQuery} from '@tanstack/react-query'

export const useChatRoomInfo = (roomId?: string | null) => {
  return useQuery({
    queryKey: ['chatRoom', roomId],
    enabled: !!roomId,
    queryFn: async () => {
      if (!roomId) return null
      const roomInfo: ChatListItem | null =
        await chatService.getChatRoomWithMemberInfo(roomId)
      return roomInfo
    },
  })
}
