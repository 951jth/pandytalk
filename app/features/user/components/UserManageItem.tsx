import COLORS from '@app/shared/constants/color'
import {User} from '@app/shared/types/auth'
import OnlineBadge from '@app/shared/ui/badge/OnlineBadge'
import ColorChip from '@app/shared/ui/chip/ColorChip'
import PressableWrapper from '@app/shared/ui/common/PressableWrapper'
import {Timestamp} from '@react-native-firebase/firestore'
import dayjs from 'dayjs'
import React from 'react'
import {Image, StyleProp, StyleSheet, Text, View, ViewStyle} from 'react-native'
import {Icon} from 'react-native-paper'

interface UserManageItemProps {
  item: User
  style?: StyleProp<ViewStyle>
  onPress: (user: User) => void
}

/**
 * 관리자가 유저 상태를 관리하고 확인하기 위한 아이템 컴포넌트
 */
export default function UserManageItem({
  item,
  style,
  onPress = () => {},
}: UserManageItemProps) {
  const formattedDate = item?.createdAt instanceof Timestamp
    ? dayjs(item?.createdAt?.toDate()).format('YYYY.MM.DD')
    : '-'

  return (
    <PressableWrapper
      borderRadius={28}
      onPress={() => onPress(item)}
      style={[styles.cardContainer, style]}>
        {/* 아바타 영역 */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            {item?.photoURL ? (
              <Image
                source={{uri: item?.photoURL}}
                resizeMode="cover"
                style={styles.avatarImage}
              />
            ) : (
              <Icon source="account" size={32} color={COLORS.primary} />
            )}
          </View>
          {item?.status === 'online' && (
            <OnlineBadge isOnline={true} />
          )}
        </View>

        {/* 유저 정보 영역 */}
        <View style={styles.infoSection}>
          <Text style={styles.userName}>{item?.displayName || '이름 없음'}</Text>
          <Text style={styles.userEmail} numberOfLines={1}>{item?.email || '-'}</Text>
        </View>
        {/* 상태 및 날짜 영역 (우측) */}
        <View style={styles.statusSection}>
          <ColorChip status={item.accountStatus} />
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>
    </PressableWrapper>
  )
}

const styles = StyleSheet.create({
  cardContainer: {
    flex:1,
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
    marginVertical: 8,
    marginHorizontal: 12,
  },
  avatarSection: {
    marginRight: 16,
    position: 'relative',
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F9F9F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  infoSection: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontFamily: 'BMDOHYEON',
    color: '#2D2D2D',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 12,
    fontFamily: 'BMDOHYEON',
    color: COLORS.textSecondary,
    opacity: 0.7,
  },
  statusSection: {
    alignItems: 'flex-end',
    gap: 8,
  },
  dateText: {
    fontSize: 10,
    fontFamily: 'BMDOHYEON',
    color: '#ADB5BD',
  },
})
