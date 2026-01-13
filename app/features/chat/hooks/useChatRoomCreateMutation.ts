import {chatService} from '@app/features/chat/service/chatService'
import {ChatRoom} from '@app/shared/types/chat'
import {useAppSelector} from '@app/store/reduxHooks'
import {useMutation, useQueryClient} from '@tanstack/react-query'

type CreateChatRoomParams = {
  targetIds: string[]
  type: ChatRoom['type']
}

export const useCreateChatRoomMutation = () => {
  const {data: user} = useAppSelector(state => state.user)
  const queryClient = useQueryClient()
  const mutaion = useMutation({
    mutationFn: async ({targetIds, type}: CreateChatRoomParams) => {
      if (!user?.uid) return null
      const chatRoomRes = await chatService.createChatRoom({
        myId: user?.uid,
        targetIds,
        type,
      })
      return chatRoomRes
    },
    onSuccess: chatRoomRes => {
      if (!chatRoomRes?.id) return
      queryClient.setQueryData(['chatRoom', chatRoomRes.id], chatRoomRes)
    },
  })

  return mutaion
}
