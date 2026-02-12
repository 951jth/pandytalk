import {messageLocal} from '@app/features/chat/data/messageLocal.sqlite'
import {messageRemote} from '@app/features/chat/data/messageRemote.firebase'
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
      let isCancelled = false
      // 만약 동기화(syncNewMessages)나 구독(subscribeChatMessages)이
      // 완료되기 전에 사용자가 페이지를 이탈하면
      // 클린업 함수가 실행된 이후에 이전에 실행된 구독로직이 트리거 되고, 메모리에 남아있음
      const setupSubscription = async () => {
        try {
          if (!roomId) return

          // 1. 현재 로컬의 마지막 SEQ 조회
          const localLastSeq = await messageLocal.getMaxLocalSeq(roomId)
          if (isCancelled) return

          // 2. 구독 시작
          // 로컬 데이터가 있으면 그 지점 이후의 데이터만 구독
          // 로컬 데이터가 없으면 서버의 현재 마지막 SEQ 이후부터 실시간 구독
          const startSeq =
            localLastSeq ||
            serverLastSeq ||
            (await messageRemote.getLatestSeq(roomId))

          unsubRef.current = messageService.subscribeChatMessages(
            roomId,
            startSeq,
            (newMessages: ChatMessage[]) => {
              if (!isCancelled) {
                addMessages(newMessages)
              }
            },
          )
        } catch (e) {
          console.log('useSyncAndSubsMessages error:', e)
        }
      }
      setupSubscription()
      return () => {
        isCancelled = true
        if (unsubRef.current) {
          unsubRef.current()
          unsubRef.current = null
        }
      }
    }, [roomId, addMessages]),
  )
}
