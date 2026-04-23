import {useChatMessageUpsertMutation} from '@app/features/chat/hooks/useChatMessageUpsertMutation'
import {messageService} from '@app/features/chat/service/messageService'
import type {ChatMessage, ChatRoom} from '@app/shared/types/chat'
import {useFocusEffect} from '@react-navigation/native'
import {useCallback, useEffect, useRef, useState} from 'react'

export const useSubscribeChatMessages = (
  roomId?: string | null,
  roomInfo?: ChatRoom | null,
) => {
  const unsubRef = useRef<(() => void) | null>(null)
  const initialSeqRef = useRef<number | undefined>(undefined)
  const [isReady, setIsReady] = useState(false)
  const {addMessages} = useChatMessageUpsertMutation(roomId)

  // 방이 바뀌면 모든 상태 초기화
  useEffect(() => {
    initialSeqRef.current = undefined
    setIsReady(false)
  }, [roomId])

  // 처음으로 유효한 정보가 들어오면 고정하고 준비 완료 처리
  useEffect(() => {
    if (isReady) return

    // 1. 방 정보가 없음 확정 (신규 방) -> 0부터 구독
    if (roomInfo === null) {
      initialSeqRef.current = 0
      setIsReady(true)
    }
    // 2. 방 정보가 있음 (기존 방) -> 해당 시퀀스 고정
    else if (roomInfo !== undefined) {
      initialSeqRef.current = roomInfo.lastSeq ?? 0
      setIsReady(true)
    }
    // roomInfo가 undefined면 아직 로딩 중이므로 대기
  }, [roomInfo, isReady])

  useFocusEffect(
    useCallback(() => {
      // 준비가 되었을 때만 구독 시작
      if (!roomId || !isReady || initialSeqRef.current === undefined) return

      // 구독 시작: 고정된 initialSeqRef 시점부터 리스너를 실행하여
      // 중간에 seq가 업데이트되어도 구독이 재시작되거나 업데이트를 놓치지 않게 함
      unsubRef.current = messageService.subscribeChatMessages(
        roomId,
        initialSeqRef.current,
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
    }, [roomId, addMessages, isReady]), // isReady가 변할 때 딱 한 번 실행됨
  )
}
