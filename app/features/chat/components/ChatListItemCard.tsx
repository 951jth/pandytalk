import dayjs from 'dayjs'
import React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import FastImage from 'react-native-fast-image'
import {Icon} from 'react-native-paper'

import COLORS from '@shared/constants/color'
import {ChatItemWithMemberInfo} from '@shared/types/chat'
import PressableWrapper from '@shared/ui/common/PressableWrapper'
import {toMillisFromServerTime} from '@shared/utils/firebase'

type propTypes = {
  item: ChatItemWithMemberInfo
  moveToChatRoom?: (
    targetId?: string | undefined,
    roomId?: string | undefined,
  ) => void
}

export default function ChatListItemCard({item, moveToChatRoom}: propTypes) {
  const findMember = item?.findMember
  const nameMaps = {
    dm: {name: findMember?.displayName, image: findMember?.photoURL},
    group: {name: item?.name, image: item?.image},
    ai: {name: findMember?.displayName, image: findMember?.photoURL},
  }
  const viewByType = nameMaps?.[item?.type]
  const targetId = item?.findMember?.id
  const roomId = item?.id
  const lastSeenAt = toMillisFromServerTime(findMember?.lastSeen)
  const isOnline = !!(
    findMember?.status === 'online' &&
    (lastSeenAt ? dayjs().diff(dayjs(lastSeenAt), 'minute') < 15 : true)
  )

  return (
    <PressableWrapper
      onPress={() => moveToChatRoom?.(targetId, roomId)}
      style={styles.chatRoom}>
      <View style={styles.avatarFrame}>
        {viewByType?.image ? (
          <FastImage
            source={{uri: viewByType?.image}}
            resizeMode={FastImage.resizeMode.cover}
            style={styles.avatarImage}
          />
        ) : (
          <View style={styles.defaultAvatar}>
            <Icon source="account" size={32} color={COLORS.primary} />
          </View>
        )}
        {isOnline && <View style={styles.onlineStatus} />}
      </View>
      
      <View style={styles.contents}>
        <View style={styles.headerArea}>
          <Text style={styles.name} numberOfLines={1}>
            {viewByType?.name ?? '알 수 없음'}
          </Text>
          <Text style={styles.lastSendTime}>
            {item?.lastMessage?.createdAt
              ? dayjs(toMillisFromServerTime(item?.lastMessage?.createdAt)).fromNow()
              : ''}
          </Text>
        </View>
        
        <View style={styles.messageArea}>
          <Text style={styles.lastMessage} numberOfLines={1} ellipsizeMode="tail">
            {item?.lastMessage?.type === 'image' && !item?.lastMessage?.text
              ? '(사진)'
              : item?.lastMessage?.text || '새로운 대화를 시작해보세요'}
          </Text>
          {!!item?.unreadCount && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCountText}>{item?.unreadCount > 99 ? '99+' : item?.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </PressableWrapper>
  )
}

const styles = StyleSheet.create({
  chatRoom: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBF9', // ✅ 프리미엄 크림 베이지 유지
    marginHorizontal: 16,
    marginVertical: 10, // 최초의 여백으로 복원
    padding: 16,
    borderRadius: 32, // ✅ 최초의 하이퍼 곡률로 복원
    // 최초의 부드러운 소프트 섀도우
    shadowColor: '#2D241F',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
  },
  avatarFrame: {
    position: 'relative',
    width: 60, // 조금 더 키움
    height: 60,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 20, // 아바타도 카드와 어울리는 라운드 스퀘어
    backgroundColor: COLORS.outerColor,
  },
  defaultAvatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: COLORS.outerColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineStatus: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: COLORS.success,
    borderWidth: 2.5,
    borderColor: '#FFFBF9',
  },
  contents: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  headerArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 17,
    fontFamily: 'BMDOHYEON',
    color: '#2D2D2D', // 딥 차콜
    flex: 1,
    marginRight: 8,
  },
  lastSendTime: {
    fontSize: 11,
    fontFamily: 'BMDOHYEON',
    color: '#BDBDBD',
  },
  messageArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    fontFamily: 'BMDOHYEON',
    color: '#757575',
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadCountText: {
    color: COLORS.onPrimary,
    fontSize: 11,
    fontFamily: 'BMDOHYEON',
    textAlign: 'center',
  },
})
