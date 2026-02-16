import {useChatMessageUpsertMutation} from '@app/features/chat/hooks/useChatMessageUpsertMutation'
import {messageService} from '@app/features/chat/service/messageService'
import type {ChatMessage} from '@app/shared/types/chat'
import {useFocusEffect} from '@react-navigation/native'
import {useCallback, useRef} from 'react'

export const useSubscribeChatMessages = (
  roomId?: string | null,
  serverLastSeq?: number,
) => {
  const unsubRef = useRef<(() => void) | null>(null)
  const {addMessages} = useChatMessageUpsertMutation(roomId)

  useFocusEffect(
    useCallback(() => {
      if (!roomId || serverLastSeq === undefined) return

      // 구독 시작: 부모에서 전달해준 서버의 최신 시점부터 리스너를 실행하여 부하 방지
      unsubRef.current = messageService.subscribeChatMessages(
        roomId,
        serverLastSeq,
        (newMessages: ChatMessage[]) => {
          addMessages(newMessages)
        },
      )

      return () => {
        if (unsubRef.current) {
          unsubRef.current()
          unsubRef.current = null
        }
      }
    }, [roomId, serverLastSeq, addMessages]),
  )
}
