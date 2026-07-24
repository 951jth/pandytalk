import {useChatMessageUpsertMutation} from '@app/features/chat/hooks/useChatMessageUpsertMutation'
import {messageService} from '@app/features/chat/service/messageService'
import {useFocusEffect} from '@react-navigation/native'
import {useCallback} from 'react'

export const useSubscribeChatMessages = (roomId?: string | null) => {
  const {mergeMessagesIntoCache} = useChatMessageUpsertMutation(roomId)

  useFocusEffect(
    useCallback(() => {
      if (!roomId) return

      let isActive = true
      let unsubscribe: (() => void) | undefined

      void messageService
        .subscribeChatMessages(
          roomId,
          newMessages => {
            if (!isActive) return
            mergeMessagesIntoCache(newMessages)
          },
        )
        .then(nextUnsubscribe => {
          if (!isActive) {
            nextUnsubscribe()
            return
          }
          unsubscribe = nextUnsubscribe
        })
        .catch(error => {
          if (isActive) {
            console.warn('[subscribeChatMessages] failed to start', error)
          }
        })

      return () => {
        isActive = false
        unsubscribe?.()
      }
    }, [roomId, mergeMessagesIntoCache]),
  )
}
