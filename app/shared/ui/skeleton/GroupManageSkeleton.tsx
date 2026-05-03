import React from 'react'
import {StyleSheet, View} from 'react-native'
import Skeleton from './Skeleton'

/**
 * 그룹 관리 목록용 스켈레톤 카드 (GroupManageItem 스타일)
 */
export default function GroupManageSkeleton() {
  const items = Array.from({length: 8})

  return (
    <View style={styles.container}>
      {items.map((_, index) => (
        <View key={index} style={styles.cardContainer}>
          {/* 그룹 아바타 */}
          <View style={styles.avatarSection}>
            <Skeleton width={64} height={64} borderRadius={32} />
          </View>

          {/* 그룹 정보 영역 */}
          <View style={styles.infoSection}>
            <Skeleton width="60%" height={16} />
            <Skeleton width="40%" height={12} style={{marginTop: 8}} />
          </View>

          {/* 화살표(액션) 영역 */}
          <View style={styles.actionSection}>
            <Skeleton width={24} height={24} borderRadius={12} />
          </View>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
    paddingTop: 8,
  },
  cardContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarSection: {
    marginRight: 16,
  },
  infoSection: {
    flex: 1,
    justifyContent: 'center',
  },
  actionSection: {
    paddingLeft: 8,
  },
})
