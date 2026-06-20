import {messageLocal} from '@app/features/chat/data/messageLocal.sqlite'
import {useChatMessageUpsertMutation} from '@app/features/chat/hooks/useChatMessageUpsertMutation'
import {messageService} from '@app/features/chat/service/messageService'
import type {ChatMessage} from '@app/shared/types/chat'
import {useFocusEffect} from '@react-navigation/native'
import {useCallback, useRef} from 'react'

export const useSubscribeChatMessages = (roomId?: string | null) => {
  const unsubRef = useRef<(() => void) | null>(null)
  const {addMessages} = useChatMessageUpsertMutation(roomId)

  useFocusEffect(
    useCallback(() => {
      if (!roomId) return

      let isActive = true

      const subscribe = async () => {
        const localLastSeq = await messageLocal.getMaxLocalSeq(roomId)
        if (!isActive) return

        unsubRef.current = messageService.subscribeChatMessages(
          roomId,
          localLastSeq,
          (newMessages: ChatMessage[]) => {
            addMessages(newMessages)
          },
        )
      }

      subscribe().catch(error => {
        console.warn('[subscribeChatMessages] failed to start', error)
      })

      return () => {
        isActive = false
        if (unsubRef.current) {
          unsubRef.current()
          unsubRef.current = null
        }
      }
    }, [roomId, addMessages]),
  )
}
