import COLORS from '@app/shared/constants/color'
import {User} from '@app/shared/types/auth'
import ColorChip from '@app/shared/ui/chip/ColorChip'
import PressableWrapper from '@app/shared/ui/common/PressableWrapper'
import {Timestamp} from '@react-native-firebase/firestore'
import dayjs from 'dayjs'
import React from 'react'
import {Image, StyleProp, StyleSheet, Text, View, ViewStyle} from 'react-native'
import {Icon} from 'react-native-paper'

interface RequestMember {
  item: User
  style?: StyleProp<ViewStyle>
  onPress: (uid: object) => void
}

// const ButtonsByType = {
//   pending: [
//     {label: '승인', bgColor: '#2E7D32', onPress: () => {}},
//     {label: '거절', bgColor: '#F44336', onPress: () => {}},
//   ],
//   confirm: [
//     {label: '수정', bgColor: '#2E7D32', onPress: () => {}},
//     {label: '정지', bgColor: '#FF9800', onPress: () => {}},
//   ],
//   reject: [
//     {label: '승인', bgColor: '#2E7D32', onPress: () => {}},
//     {label: '삭제', bgColor: '#F44336', onPress: () => {}},
//   ],
// }

export default function UserListItem({
  item,
  style,
  onPress = () => {},
}: RequestMember) {
  const formattedDate = item?.createdAt instanceof Timestamp
    ? dayjs(item?.createdAt?.toDate()).format('YYYY.MM.DD')
    : '-'

  return (
    <PressableWrapper onPress={() => onPress(item)} style={[styles.cardWrapper, style]}>
      <View style={styles.cardContainer}>
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
      </View>
    </PressableWrapper>
  )
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginVertical: 8,
    marginHorizontal: 12,
  },
  cardContainer: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 28, // 프리미엄 곡률
    flexDirection: 'row',
    alignItems: 'center',
    // 프리미엄 소프트 디퓨전 섀도우
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarSection: {
    marginRight: 16,
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
