import dayjs from 'dayjs'
import React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import FastImage from 'react-native-fast-image'
import {Icon} from 'react-native-paper'
import COLORS from '../../../constants/color'
import type {ChatItemWithMemberInfo} from '../../../types/chat'
import {toMillisFromServerTime} from '../../../utils/firebase'
import PressableWrapper from '../../common/PressableWrapper'

type propTypes = {
  item: ChatItemWithMemberInfo
  onPress?: (item: ChatItemWithMemberInfo) => void
}

export default function ChatListItemCard({item, onPress}: propTypes) {
  const isDM = item?.type == 'dm'
  const findMember = item?.findMember
  const targetId = findMember?.id
  const nameMaps = {
    dm: {name: findMember?.displayName, image: findMember?.photoURL},
    group: {name: item?.name, image: item?.image},
  }
  const viewItem = nameMaps?.[item?.type]

  return (
    <PressableWrapper onPress={() => onPress?.(item)} style={styles.chatRoom}>
      <View style={styles.frame}>
        {viewItem?.image ? (
          <FastImage
            source={{uri: viewItem?.image}}
            resizeMode={FastImage.resizeMode.cover}
            style={styles.image}
          />
        ) : (
          <Icon source="account" size={40} color={COLORS.primary} />
        )}
        {findMember?.status == 'online' && <View style={styles.point} />}
      </View>
      <View style={styles.contents}>
        <Text style={styles.name}>{viewItem?.name ?? '-'}</Text>
        <Text style={styles.lastMessage} numberOfLines={1} ellipsizeMode="tail">
          {item?.lastMessage?.text || '대화 없음'}
        </Text>
        <Text style={styles.lastSendTime}>
          {item?.lastMessage?.createdAt
            ? dayjs(
                toMillisFromServerTime(item?.lastMessage?.createdAt),
              ).fromNow()
            : '알 수 없음'}
        </Text>
        {!!item?.unreadCount && (
          <View style={styles.unreadMessageBadge}>
            <Text style={styles.unreadMessage}>{item?.unreadCount || 0}</Text>
          </View>
        )}
      </View>
    </PressableWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatContents: {
    // flex: 1,
    // alignItems: 'center',
    // justifyContent: 'center',
    flexGrow: 1,
    backgroundColor: COLORS.outerColor,
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  chatRoom: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
    borderRadius: 8,
    padding: 8,
  },
  frame: {
    width: 55,
    height: 55,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: COLORS.primary,
    borderWidth: 1,
    position: 'relative',
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  point: {
    backgroundColor: '#2CC069',
    width: 14,
    height: 14,
    borderRadius: 100,
    borderColor: '#FFF',
    borderWidth: 2,
    position: 'absolute',
    right: -6,
    top: -6,
  },
  contents: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 14,
    color: '#000',
    fontFamily: 'BMDOHYEON',
  },
  lastMessage: {
    fontSize: 12,
    color: '#ADB5BD',
    fontFamily: 'BMDOHYEON',
  },
  lastSendTime: {
    fontSize: 12,
    color: '#ADB5BD',
    position: 'absolute',
    top: 0,
    right: 0,
    fontFamily: 'BMDOHYEON',
  },
  unreadMessageBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center', // ✅ 세로 중앙
    backgroundColor: COLORS.primary,
  },
  unreadMessage: {
    color: COLORS.onPrimary,
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'BMDOHYEON',
  },
})
