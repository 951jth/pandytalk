import COLORS from '@app/shared/constants/color'
import {Group} from '@app/features/group/types/group'
import {Timestamp} from '@react-native-firebase/firestore'
import dayjs from 'dayjs'
import React from 'react'
import {
  Image,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import {Icon} from 'react-native-paper'
import PressableWrapper from '../../../shared/ui/common/PressableWrapper'

type propTypes = {
  item: Group
  onPress: (item: Group) => void
  style?: StyleProp<ViewStyle>
}

export default function GroupManageItem({item, onPress, style}: propTypes) {
  const formattedDate = item?.createdAt instanceof Timestamp
    ? dayjs(item?.createdAt?.toDate()).format('YYYY.MM.DD')
    : '-'

  return (
    <PressableWrapper
      borderRadius={28}
      onPress={() => onPress(item)}
      style={[styles.cardContainer, style]}>
        {/* 그룹 아바타 영역 */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            {item?.photoURL ? (
              <Image
                source={{uri: item?.photoURL}}
                resizeMode="cover"
                style={styles.avatarImage}
              />
            ) : (
              <Icon
                source="account-multiple-outline"
                size={34}
                color={COLORS.primary}
              />
            )}
          </View>
        </View>

        {/* 그룹 정보 영역 */}
        <View style={styles.infoSection}>
          <Text style={styles.groupName}>{item?.name || '그룹 이름 없음'}</Text>
          <Text style={styles.groupDate}>{formattedDate} 생성</Text>
        </View>

        {/* 편집 유도 아이콘 (우측) */}
        <View style={styles.actionSection}>
          <Icon source="chevron-right" size={24} color="#ADB5BD" />
        </View>
    </PressableWrapper>
  )
}

const styles = StyleSheet.create({

  cardContainer: {
    flex: 1,
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
    marginVertical: 8,
    marginHorizontal: 12,
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
  groupName: {
    fontSize: 16,
    fontFamily: 'BMDOHYEON',
    color: '#2D2D2D',
    marginBottom: 4,
  },
  groupDate: {
    fontSize: 12,
    fontFamily: 'BMDOHYEON',
    color: COLORS.textSecondary,
    opacity: 0.7,
  },
  actionSection: {
    paddingLeft: 8,
  },
})
