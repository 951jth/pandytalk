import AppHeader from '@app/layout/AppHeader'
import COLORS from '@app/shared/constants/color'
import EmptyData from '@app/shared/ui/common/EmptyData'
import React from 'react'
import {FlatList, StyleSheet, Text, View} from 'react-native'
import AdminInquiriesSkeleton from '@app/shared/ui/skeleton/AdminInquiriesSkeleton'
import {useAdminInquiriesQuery} from '@app/features/admin/hooks/useAdminInquiriesQuery'
import type {Inquiry} from '@app/features/admin/service/inquiryService'

function AdminInquiryItem({item}: {item: Inquiry}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
        <Text style={styles.date}>
          {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'N/A'}
        </Text>
      </View>
      <Text style={styles.type}>유형: {item.type || 'general'}</Text>
      <Text style={styles.email}>이메일: {item.email}</Text>
      <Text style={styles.source}>출처: {item.source}</Text>
      <View style={styles.messageContainer}>
        <Text style={styles.message}>{item.message}</Text>
      </View>
    </View>
  )
}

export default function AdminInquiriesScreen() {
  const {data: inquiries = [], isLoading, refetch} = useAdminInquiriesQuery()

  return (
    <View style={styles.container}>
      <AppHeader title="문의 관리" />
      {isLoading && !inquiries.length ? (
        <AdminInquiriesSkeleton />
      ) : (
        <FlatList
          data={inquiries}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.contentContainer}
          renderItem={({item}) => <AdminInquiryItem item={item} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <EmptyData text="문의 내역이 없습니다." />
            </View>
          }
          refreshing={isLoading}
          onRefresh={refetch}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
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
    marginBottom: 8,
  },
  badge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  type: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: COLORS.text,
  },
  email: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  source: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  messageContainer: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  message: {
    fontSize: 14,
    color: COLORS.text,
  },
})
