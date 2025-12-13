import React from 'react'
import PandyBadge from '../../../shared/ui/badge/PandyBadge'
import {useAppSelector} from '../../../store/reduxHooks'
import type {ChatListItem} from '../../../types/chat'

type propTypes = {
  type: ChatListItem['type']
}

export default function ChatUnreadCount({type = 'dm'}: propTypes) {
  const unreadCountMap = useAppSelector(state => state?.unreadCount)
  return <PandyBadge count={unreadCountMap?.[type] ?? 0} />
}
