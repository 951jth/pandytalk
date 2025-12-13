import React from 'react'
import {StyleSheet} from 'react-native'
import PandyBadge from '../../../shared/ui/badge/PandyBadge'
import {useAppSelector} from '../../../store/reduxHooks'
import {useSubscribeChatUnreadCount} from '../hooks/useChatRoomQuery'

export default function GroupChatUnreadCount() {
  const {data: userInfo} = useAppSelector(state => state.user)
  const roomId = userInfo?.groupId
  const userId = userInfo?.uid
  const {unreadCnt} = useSubscribeChatUnreadCount(roomId, userId)

  return !!unreadCnt && <PandyBadge count={unreadCnt} />
}

const styles = StyleSheet.create({})
