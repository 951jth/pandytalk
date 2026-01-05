import {chatService} from '@app/features/chat/service/chatService'
import type {ChatRoom} from '@app/shared/types/chat'
import {useQuery} from '@tanstack/react-query'

export const useChatRoomInfo = (roomId?: string | null) => {
  return useQuery({
    queryKey: ['chatRoom', roomId],
    enabled: !!roomId,
    queryFn: async () => {
      if (!roomId) return null
      const roomInfo: ChatRoom | null =
        await chatService.getChatRoomWithMemberInfo(roomId)
      return roomInfo
    },
  })
}
