import React from 'react'

import {useAppSelector} from '@app/store/reduxHooks'
import {useSubscribeChatUnreadCount} from '@features/chat/hooks/useSubscribeChatUnreadCount'
import PandyBadge from '@shared/ui/badge/PandyBadge'

export default function GroupChatUnreadCount() {
  const {data: userInfo} = useAppSelector(state => state.user)
  const roomId = userInfo?.groupId
  const userId = userInfo?.uid
  const {unreadCnt} = useSubscribeChatUnreadCount(roomId, userId)

  return !!unreadCnt && <PandyBadge count={unreadCnt} />
}
