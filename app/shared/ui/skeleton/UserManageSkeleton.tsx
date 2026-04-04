import React from 'react'
import {StyleSheet, View} from 'react-native'
import Skeleton from './Skeleton'

/**
 * 어드민 유저 관리 목록용 스켈레톤 카드
 */
export default function UserManageSkeleton() {
  const items = Array.from({length: 8})

  return (
    <View style={styles.container}>
      {items.map((_, index) => (
        <View key={index} style={styles.cardContainer}>
          {/* 아바타 */}
          <View style={styles.avatarSection}>
            <Skeleton width={64} height={64} borderRadius={32} />
          </View>

          {/* 유저 정보 */}
          <View style={styles.infoSection}>
            <Skeleton width="50%" height={16} />
            <Skeleton width="40%" height={12} style={{marginTop: 6}} />
          </View>

          {/* 상태 및 날짜 */}
          <View style={styles.statusSection}>
            <Skeleton width={60} height={24} borderRadius={12} />
            <Skeleton width={50} height={10} style={{marginTop: 8}} />
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
  statusSection: {
    alignItems: 'flex-end',
  },
})
