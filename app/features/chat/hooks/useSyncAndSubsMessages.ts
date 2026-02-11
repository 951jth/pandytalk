import {messageLocal} from '@app/features/chat/data/messageLocal.sqlite'
import {useChatMessageUpsertMutation} from '@app/features/chat/hooks/useChatMessageUpsertMutation'
import {messageService} from '@app/features/chat/service/messageService'
import type {ChatMessage} from '@app/shared/types/chat'
import {useFocusEffect} from '@react-navigation/native'
import {useCallback, useRef} from 'react'

export const useSyncAndSubsMessages = (
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
      const setupSusscribeChatMessages = async () => {
        try {
          if (!roomId) return
          let newMsgs: ChatMessage[] = []
          //1. 현재 시점으로 가장 마지막 로컬 SEQ 조회
          const localLastSeq = await messageLocal.getMaxLocalSeq(roomId)
          // 만약 await 중에 컴포넌트가 언마운트 되었다면 중단
          if (isCancelled) return
          // 2. 로컬 SEQ가 서버 SEQ보다 작으면
          if (localLastSeq < (serverLastSeq ?? 0)) {
            //localMaxSeq가 serverLastSeq보다 작으면
            //데이터를 현재 시점으로 모두 조회
            newMsgs = await messageService.syncNewMessages(roomId, localLastSeq)
            if (newMsgs?.length) {
              addMessages(newMsgs)
            }
          }
          if (isCancelled) return
          //2. 마지막 시퀀스를 기준으로 구독 시작 (채팅방정보가 없어도 구독은 타야함.)
          unsubRef.current = await messageService.subscribeChatMessages(
            roomId,
            serverLastSeq ?? 0,
            (newMessages: ChatMessage[]) => {
              addMessages(newMessages)
            },
          )
        } catch (e) {
          console.log('useSyncAndSubsMessages error:', e)
          return () => {}
        }
      }
      setupSusscribeChatMessages()
      return () => {
        isCancelled = true // 비동기 작업 취소 플래그 설정
        if (unsubRef.current) {
          unsubRef.current() // 소켓/리스너 해제
          unsubRef.current = null
        }
      }
    }, [roomId]),
  )
}
