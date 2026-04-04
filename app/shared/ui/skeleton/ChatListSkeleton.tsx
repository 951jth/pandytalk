import React from 'react'
import {StyleSheet, View} from 'react-native'
import Skeleton from './Skeleton'

/**
 * 채팅방 목록 로딩 시 보여줄 스켈레톤 카드
 */
export default function ChatListSkeleton() {
  const items = Array.from({length: 6}) // 6개 정도 생성

  return (
    <View style={styles.outerContainer}>
      {/* 검색창 스켈레톤 */}
      <View style={styles.searchWrapper}>
        <Skeleton width="100%" height={50} borderRadius={25} />
      </View>

      <View style={styles.container}>
        {items.map((_, index) => (
          <View key={index} style={styles.chatRoom}>
            <View style={styles.avatarFrame}>
              <Skeleton width={60} height={60} borderRadius={20} />
            </View>
            
            <View style={styles.contents}>
              <View style={styles.headerArea}>
                <Skeleton width="50%" height={18} />
                <Skeleton width="15%" height={12} />
              </View>
              
              <View style={styles.messageArea}>
                <Skeleton width="80%" height={14} style={{marginTop: 6}} />
                <Skeleton width={20} height={20} borderRadius={10} style={{marginTop: 6}} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  container: {
    paddingTop: 0,
  },
  chatRoom: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBF9', // ✅ 프리미엄 크림 베이지 유지
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 16,
    borderRadius: 32, // ✅ 프리미엄 하이퍼 곡률 유지
    // 그림자
    shadowColor: '#2D241F',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
  },
  avatarFrame: {
    width: 60,
    height: 60,
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
  messageArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
})
