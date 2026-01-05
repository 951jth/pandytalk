import {readStatusRemote} from '@app/features/chat/data/readStatusRemote.firebase'
import {ChatMessage, ChatRoom} from '@app/shared/types/chat'
import {useFocusEffect} from '@react-navigation/native'
import {useCallback, useEffect, useRef} from 'react'

export const useUpdateLastReadOnBlur = (
  userId?: string | null,
  roomInfo?: ChatRoom | null,
  messages?: ChatMessage[],
) => {
  const roomInfoRef = useRef(roomInfo) // 포커스 이벤트용 참조값.
  const messagesRef = useRef(messages) // 포커스 이벤트용 참조값.

  // 최신값 유지
  useEffect(() => {
    roomInfoRef.current = roomInfo
  }, [roomInfo])
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  //스크린이 “포커스될 때”
  useFocusEffect(
    //매렌더마다 재등록/cleanup을 실행해서 참조고정
    useCallback(() => {
      return () => {
        const room = roomInfoRef.current

        const currentReadSeq = room?.lastReadSeqs?.[userId ?? ''] ?? 0
        const msgs = messagesRef.current ?? []
        if (!userId || !room?.id) return

        //해당 유저 마지막 읽음 처리
        const lastSeq =
          msgs.length > 0
            ? msgs.reduce((acc, m) => Math.max(acc, m.seq ?? 0), 0)
            : 0

        if (currentReadSeq !== lastSeq) {
          //채팅방 벗어나면 seq, read time 설정
          readStatusRemote.updateChatLastReadByUser(room.id, userId, lastSeq)
        }
      }
    }, [userId]),
  )
}
