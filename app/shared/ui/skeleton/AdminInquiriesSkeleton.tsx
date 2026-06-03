import React from 'react'
import {ScrollView, StyleSheet, View} from 'react-native'
import Skeleton from './Skeleton'

export default function AdminInquiriesSkeleton() {
  const listItems = Array.from({length: 5})

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.contentContainer}>
        {listItems.map((_, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.cardHeader}>
              <Skeleton width={50} height={24} borderRadius={4} />
              <Skeleton width={80} height={16} />
            </View>
            <Skeleton width="40%" height={16} style={{marginBottom: 8}} />
            <Skeleton width="60%" height={16} style={{marginBottom: 8}} />
            <Skeleton width="50%" height={16} style={{marginBottom: 16}} />
            <View style={styles.messageContainer}>
              <Skeleton width="100%" height={16} style={{marginBottom: 6}} />
              <Skeleton width="80%" height={16} />
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
    padding: 16,
    paddingTop: 0, // AppHeader 아래에 바로 붙기 때문에 약간의 조정이 필요할 수 있음 (일반적으로 padding: 16임)
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  messageContainer: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
})
