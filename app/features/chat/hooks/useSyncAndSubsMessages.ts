import {messageLocal} from '@app/features/chat/data/messageLocal.sqlite'
import {useSendChatMessageMutation} from '@app/features/chat/hooks/useChatMessageUpsertMution'
import {messageService} from '@app/features/chat/service/messageService'
import type {ChatMessage, ChatRoom} from '@app/shared/types/chat'
import type {ReactQueryPageType} from '@app/shared/types/react-quert'
import {type InfiniteData} from '@tanstack/react-query'
import {useEffect, useRef} from 'react'

type MessagesInfiniteData = InfiniteData<ReactQueryPageType<ChatMessage>>

export const useSyncAndSubsMessages = (roomInfo?: ChatRoom | null) => {
  const unsubRef = useRef<(() => void) | null>(null)
  const roomId = roomInfo?.id
  const {addMessages} = useSendChatMessageMutation(roomId)

  useEffect(() => {
    let isCancelled = false
    // 만약 동기화(syncNewMessages)나 구독(subscribeChatMessages)이
    // 완료되기 전에 **사용자가 페이지를 이탈(Unmount)**하면
    // 클린업 함수가 실행된 이후에 이전에 실행된 구독로직이 트리거 되고, 메모리에 남아있음
    const setupSusscribeChatMessages = async () => {
      try {
        if (!roomId) return
        let newMsgs: ChatMessage[] = []
        //1. 현재 시점으로 메세지 동기화
        const localMaxSeq = await messageLocal.getMaxLocalSeq(roomId)
        // 만약 await 중에 컴포넌트가 언마운트 되었다면 중단
        if (isCancelled) return
        //채팅방이 없는경우도 존재함
        try {
          //채팅방이 아직 생성안된경우에도 구독로직은 타야함.
          //네트워크를 다시켜고 동기화 할떄는 sqlite에서 맞춰와서 동기화한다.

          newMsgs = await messageService.syncNewMessages(roomId, localMaxSeq)
          addMessages(newMsgs)
        } catch (e) {}

        const lastSeq =
          newMsgs.length > 0
            ? newMsgs.reduce((acc, m) => Math.max(acc, m.seq ?? 0), localMaxSeq)
            : localMaxSeq
        //2. 마지막 시퀀스를 기준으로 구독 시작
        unsubRef.current = await messageService.subscribeChatMessages(
          roomId,
          lastSeq,
          (newMessages: ChatMessage[]) => {
            addMessages(newMessages)
          },
        )
      } catch (e) {
        console.log(e)
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
  }, [roomId, roomInfo])
}
