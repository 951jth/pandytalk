import React from 'react'
import {ScrollView, StyleSheet, View} from 'react-native'
import Skeleton from '@app/shared/ui/skeleton/Skeleton'

/**
 * 유저 목록(친구 목록) 전체 화면 스켈레톤
 * 검색창, 그룹 대시보드, 헤더, 리스트를 포함합니다.
 */
export default function UserListSkeleton() {
  const listItems = Array.from({length: 6})

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. 검색창 스켈레톤 (SearchInput) */}
      <View style={styles.searchWrapper}>
        <Skeleton width="100%" height={50} borderRadius={25} />
      </View>

      {/* 2. 그룹 대시보드 스켈레톤 (GroupMainThumnail) */}
      <View style={styles.dashboardCard}>
        <View style={styles.cardHeader}>
          <View style={styles.greeting}>
            <Skeleton width={80} height={12} style={{marginBottom: 8}} />
            <Skeleton width={120} height={28} />
          </View>
          <Skeleton width={64} height={64} borderRadius={32} />
        </View>
        <View style={styles.groupInfo}>
          <Skeleton width="60%" height={24} />
          <Skeleton width={40} height={24} borderRadius={12} />
        </View>
        <View style={styles.descriptionBox}>
          <Skeleton width="100%" height={14} style={{marginBottom: 6}} />
          <Skeleton width="80%" height={14} />
        </View>
      </View>

      {/* 3. 섹션 헤더 (All Friends) */}
      <View style={styles.sectionHeader}>
        <Skeleton width={80} height={20} />
        <Skeleton width={30} height={20} borderRadius={10} />
      </View>

      {/* 4. 친구 리스트 (UserListItem) */}
      <View style={styles.listWrapper}>
        {listItems.map((_, index) => (
          <View key={index} style={styles.userCard}>
            <View style={styles.avatarSection}>
              <Skeleton width={52} height={52} borderRadius={26} />
            </View>
            <View style={styles.infoSection}>
              <View style={styles.infoHeader}>
                <Skeleton width="40%" height={16} />
                <Skeleton width="20%" height={12} />
              </View>
              <Skeleton width="70%" height={14} style={{marginTop: 8}} />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dashboardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    marginHorizontal: 20,
    marginVertical: 16,
    padding: 24,
    minHeight: 200,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: {
    flex: 1,
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  descriptionBox: {
    marginTop: 'auto',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 12,
    gap: 8,
  },
  listWrapper: {
    paddingHorizontal: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarSection: {
    marginRight: 16,
  },
  infoSection: {
    flex: 1,
    justifyContent: 'center',
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
})
