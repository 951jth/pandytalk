import React from 'react'
import {useAppSelector} from '../../store/reduxHooks'
import type {ChatListItem} from '../../types/chat'
import PandyBadge from './PandyBadge'

type propTypes = {
  type: ChatListItem['type']
}

export default function ChatUnreadCount({type = 'dm'}: propTypes) {
  const unreadCountMap = useAppSelector(state => state?.unreadCount)
  return <PandyBadge count={unreadCountMap?.[type] ?? 0} />
}
