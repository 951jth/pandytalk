import {useMyChatListInfinite} from '@app/features/chat/hooks/useMyChatListInfinite'
import type {ChatRoom} from '@app/shared/types/chat'
import React from 'react'
import PandyBadge from '../../../shared/ui/badge/PandyBadge'
import {useAppSelector} from '../../../store/reduxHooks'

type propTypes = {
  type: ChatRoom['type']
}

export default function ChatUnreadCount({type = 'dm'}: propTypes) {
  const {data: user} = useAppSelector(state => state.user)
  const {data} = useMyChatListInfinite(user?.uid, type)

  return <PandyBadge count={data?.meta?.totalUnreadCount ?? 0} />
}
