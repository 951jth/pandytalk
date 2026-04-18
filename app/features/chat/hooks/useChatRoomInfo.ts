import {chatService} from '@app/features/chat/service/chatService'
import type {ChatRoom} from '@app/shared/types/chat'
import {useFocusEffect} from '@react-navigation/native'
import {useQuery} from '@tanstack/react-query'
import {useCallback} from 'react'

export const useChatRoomInfo = (roomId?: string | null) => {
  const queryResult = useQuery({
    queryKey: ['chatRoom', roomId],
    enabled: !!roomId,
    queryFn: async () => {
      if (!roomId) return null
      const roomInfo: ChatRoom | null =
        await chatService.getChatRoomWithMemberInfo(roomId)
      return roomInfo
    },
    staleTime: 0, // 입장 시마다 최신 lastSeq 확인을 위해 stale 상태로 간주
  })

  // 화면 포커스 시마다 최신 정보(lastSeq 등) 갱신 보장
  useFocusEffect(
    useCallback(() => {
      if (roomId) {
        queryResult.refetch()
      }
    }, [roomId]),
  )

  return queryResult
}
