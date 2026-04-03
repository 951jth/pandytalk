import {Timestamp} from '@react-native-firebase/firestore'
import React from 'react'
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native'
import FastImage from 'react-native-fast-image'
import {Icon} from 'react-native-paper'

import COLORS from '@shared/constants/color'
import {User} from '@shared/types/auth'
import dayjs from '@shared/utils/dayjs'

interface ChatMemberProps {
  item: User
  style?: StyleProp<ViewStyle>
  onPress: (uid: string) => void
}

export default function ChatMember({
  item,
  style,
  onPress = () => {},
}: ChatMemberProps) {
  const lastSeen =
    item?.lastSeen instanceof Timestamp
      ? item?.lastSeen?.toDate()
      : item?.lastSeen
  
  // 가상의 온라인 상태 체크 (최근 5분 이내 활동 시 온라인으로 간주하거나, 실제 status 필드 사용)
  const isOnline = item?.status === 'online' || (lastSeen && dayjs().diff(dayjs(Number(lastSeen)), 'minute') < 5)

  return (
    <Pressable
      onPress={() => onPress(item.uid)}
      style={({pressed}) => [
        styles.card,
        {
          transform: [{scale: pressed ? 0.98 : 1}],
          backgroundColor: pressed ? COLORS.deepGray : COLORS.surface,
        },
        style,
      ]}>
      <View style={styles.friend}>
        <View style={styles.avatarContainer}>
          {item?.photoURL ? (
            <FastImage
              source={{uri: item?.photoURL}}
              resizeMode={FastImage.resizeMode.cover}
              style={styles.image}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Icon source="account" size={32} color={COLORS.textSecondary} />
            </View>
          )}
          <View 
            style={[
              styles.statusDot, 
              {backgroundColor: isOnline ? COLORS.success : COLORS.gray}
            ]} 
          />
        </View>
        <View style={styles.contents}>
          <View style={styles.contentsRow}>
            <Text style={styles.name}>{item?.displayName}</Text>
            <Text style={styles.lastSeen}>
              {lastSeen ? dayjs(Number(lastSeen)).fromNow() : ''}
            </Text>
          </View>
          <Text style={styles.introduce} numberOfLines={1} ellipsizeMode="tail">
            {item?.intro || '멋진 소개글이 아직 없네요.'}
          </Text>
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  friend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  image: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.gray,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.outerColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  contents: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  contentsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 15,
    color: COLORS.text,
    fontFamily: 'BMDOHYEON',
  },
  lastSeen: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: 'BMDOHYEON',
  },
  introduce: {
    fontSize: 13,
    fontFamily: 'BMDOHYEON',
    color: COLORS.textSecondary,
  },
})
