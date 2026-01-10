import {chatService} from '@app/features/chat/service/chatService'
import {useEffect, useState} from 'react'

//채팅방 미읽음 카운트 구독 함수, 채팅방 단건 조회임.
export const useSubscribeChatUnreadCount = (
  roomId?: string | undefined | null,
  userId?: string,
) => {
  const [unreadCnt, setUnreadCnt] = useState(0)

  useEffect(() => {
    console.log('roomId, userId: ', roomId, userId)
    if (!roomId || !userId) return
    const unsub = chatService.subscribeChatRoom(roomId, roomInfo => {
      const {lastReadSeqs, lastSeq} = roomInfo
      const userReadSeq = lastReadSeqs?.[userId] ?? 0
      const userUnreadSeq = (lastSeq || 0) - userReadSeq
      setUnreadCnt(userUnreadSeq > 0 ? userUnreadSeq : 0)
    })
    return () => unsub()
  }, [roomId, userId])

  return {unreadCnt}
}
