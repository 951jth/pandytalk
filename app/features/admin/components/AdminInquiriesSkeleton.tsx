import React from 'react'
import {ScrollView, StyleSheet, View} from 'react-native'
import Skeleton from '@app/shared/ui/skeleton/Skeleton'

export default function AdminInquiriesSkeleton() {
  const listItems = Array.from({length: 8})

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.contentContainer}>
        {listItems.map((_, index) => (
          <View key={index} style={styles.cardContainer}>
            {/* 썸네일 */}
            <View style={styles.thumbnailSection}>
              <Skeleton width={64} height={64} borderRadius={32} />
            </View>

            {/* 이메일 및 메시지 정보 */}
            <View style={styles.infoSection}>
              <Skeleton width="50%" height={16} />
              <Skeleton width="80%" height={12} style={{marginTop: 8}} />
              <Skeleton width="60%" height={12} style={{marginTop: 4}} />
            </View>

            {/* 상태 */}
            <View style={styles.statusSection}>
              <Skeleton width={50} height={24} borderRadius={12} />
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
  contentContainer: {
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
  thumbnailSection: {
    marginRight: 16,
  },
  infoSection: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 12,
  },
  statusSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
})
