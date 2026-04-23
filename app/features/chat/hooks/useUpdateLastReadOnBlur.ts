import {readStatusRemote} from '@app/features/chat/data/readStatusRemote.firebase'
import {ChatMessage, ChatRoom} from '@app/shared/types/chat'
import {useFocusEffect} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'
import {useCallback, useEffect, useRef} from 'react'

export const useUpdateLastReadOnBlur = (
  userId?: string | null,
  roomInfo?: ChatRoom | null,
  messages?: ChatMessage[],
) => {
  const queryClient = useQueryClient()
  const roomInfoRef = useRef(roomInfo)
  const messagesRef = useRef(messages)

  // 최신값 유지
  useEffect(() => {
    roomInfoRef.current = roomInfo
  }, [roomInfo])
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  // 스크린이 "포커스 해제될 때(Blur)" 읽음 처리 실행
  useFocusEffect(
    useCallback(() => {
      // 이펙트가 처음 실행될 때는 아무것도 안 함
      return () => {
        const room = roomInfoRef.current
        const msgs = messagesRef.current ?? []

        // 방 정보, 유저 정보, 혹은 메시지가 아예 없으면 중단 (초기화 방지)
        if (!userId || !room?.id || msgs.length === 0) return

        // 1. 현재 내가 화면에서 본 가장 높은 시퀀스 계산
        const lastSeenSeq = msgs.reduce((acc, m) => Math.max(acc, m.seq ?? 0), 0)

        // 2. 서버에 기록된 나의 마지막 읽은 시퀀스
        const currentReadSeq = room?.lastReadSeqs?.[userId] ?? 0

        // 3. 내가 본 게 서버 기록보다 최신(더 클 때)일 때만 업데이트
        if (lastSeenSeq > currentReadSeq) {
          // 채팅방 벗어나면 seq, read time 설정
          readStatusRemote.updateChatLastReadByUser(room.id, userId, lastSeenSeq)
          // 채팅 목록 정보 갱신을 위해 쿼리 무효화
          queryClient.invalidateQueries({queryKey: ['chats'], exact: false})
        }
      }
    }, [userId, queryClient]), // userId를 직접 의존성에 추가
  )
}
