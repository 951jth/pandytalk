import React from 'react'

import {useAppSelector} from '@app/store/reduxHooks'
import {useMyChatListInfinite} from '@features/chat/hooks/useMyChatListInfinite'
import {ChatRoom} from '@shared/types/chat'
import PandyBadge from '@shared/ui/badge/PandyBadge'

type propTypes = {
  type?: ChatRoom['type']
}

export default function ChatUnreadCount({type = 'dm'}: propTypes) {
  const {data: user} = useAppSelector(state => state.user)
  const {data} = useMyChatListInfinite(user?.uid, type)

  return <PandyBadge count={data?.meta?.totalUnreadCount ?? 0} />
}
