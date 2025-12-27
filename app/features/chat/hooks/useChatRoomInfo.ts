import {chatService} from '@app/features/chat/service/chatService'
import type {ChatListItem} from '@app/shared/types/chat'
import {useQuery} from '@tanstack/react-query'

export const useChatRoomInfo = (roomId: string) => {
  return useQuery({
    queryKey: ['chatRoom', roomId],
    enabled: !!roomId,
    queryFn: async () => {
      try {
        if (!roomId) return null
        const roomInfo: ChatListItem = await chatService.getChatRoom(roomId)
        return roomInfo ?? null
      } catch (e) {
        console.log(e)
        return null
      }
    },
  })
}
