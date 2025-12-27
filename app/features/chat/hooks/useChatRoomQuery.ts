import {ChatListItem} from '@app/shared/types/chat'
import {doc, onSnapshot} from '@react-native-firebase/firestore'
import {useQuery} from '@tanstack/react-query'
import {useEffect, useState} from 'react'
import {getChatRoomInfoWithMembers} from '../../../services/chatService'
import {firestore} from '../../../shared/firebase/firestore'

//채팅방 미읽음 카운트 구독 함수, 채팅방 단건 조회임.
export const useSubscribeChatUnreadCount = (
  roomId?: string | undefined | null,
  userId?: string,
) => {
  const [unreadCnt, setUnreadCnt] = useState(0)
  useEffect(() => {
    if (!roomId || !userId) return
    const chatRoomRef = doc(firestore, 'chats', roomId)

    const unsub = onSnapshot(
      chatRoomRef,
      snap => {
        if (!snap.exists()) return
        const chatRoomData = snap.data() as ChatListItem
        console.log(chatRoomData)
        const {lastReadSeqs, lastSeq} = chatRoomData
        const userReadSeq = lastReadSeqs?.[userId] ?? 0
        const userUnreadSeq = (lastSeq || 0) - userReadSeq
        setUnreadCnt(userUnreadSeq > 0 ? userUnreadSeq : 0)
      },
      error => {
        console.error('[chat head snapshot] error:', error)
        // 필요 시: invalidate({ type: 'full' })
      },
    )

    return () => unsub()
  }, [roomId, userId])
  return {unreadCnt}
}

export function useChatRoomInfo(roomId: string | null) {
  return useQuery({
    queryKey: ['chatRoom', roomId],
    enabled: !!roomId,
    queryFn: async () => {
      try {
        if (!roomId) return null
        const roomInfo: ChatListItem = await getChatRoomInfoWithMembers(roomId)
        return roomInfo ?? null
      } catch (e) {
        console.log(e)
        return null
      }
    },
  })
}
