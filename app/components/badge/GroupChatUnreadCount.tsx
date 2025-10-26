import React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import COLORS from '../../constants/color'
import {useSubscribeChatUnreadCount} from '../../hooks/queries/useChatRoomQuery'
import {useAppSelector} from '../../store/reduxHooks'

export default function GroupChatUnreadCount() {
  const {data: userInfo} = useAppSelector(state => state.user)
  const roomId = userInfo?.groupId
  const userId = userInfo?.uid
  const {unreadCnt} = useSubscribeChatUnreadCount(roomId, userId)

  return (
    !!unreadCnt && (
      <View style={styles.badge}>
        <Text style={styles.count}>{unreadCnt}</Text>
      </View>
    )
  )
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: COLORS.primary,
    width: 18,
    height: 18,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    // textAlign: 'center',
  },
  count: {
    color: COLORS.onPrimary,
    fontWeight: 600,
    fontSize: 12,
  },
})
