import {useSubscribeChatUnreadCount} from '@app/features/chat/hooks/useSubscribeChatUnreadCount'
import React from 'react'
import PandyBadge from '../../../shared/ui/badge/PandyBadge'
import {useAppSelector} from '../../../store/reduxHooks'

export default function GroupChatUnreadCount() {
  const {data: userInfo} = useAppSelector(state => state.user)
  const roomId = userInfo?.groupId
  const userId = userInfo?.uid
  const {unreadCnt} = useSubscribeChatUnreadCount(roomId, userId)
  // const {data: roomInfo} = useChatRoomInfo(roomId)
  // const unreadCnt = roomInfo && userId ? getUnreadCount(roomInfo, userId) : 0

  return !!unreadCnt && <PandyBadge count={unreadCnt} />
}
