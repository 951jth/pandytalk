import React from 'react'
import {StyleSheet} from 'react-native'
import {useSubscribeChatUnreadCount} from '../../hooks/queries/useChatRoomQuery'
import {useAppSelector} from '../../store/reduxHooks'
import PandyBadge from './PandyBadge'

export default function GroupChatUnreadCount() {
  const {data: userInfo} = useAppSelector(state => state.user)
  const roomId = userInfo?.groupId
  const userId = userInfo?.uid
  const {unreadCnt} = useSubscribeChatUnreadCount(roomId, userId)

  return !!unreadCnt && <PandyBadge count={unreadCnt} />
}

const styles = StyleSheet.create({})
