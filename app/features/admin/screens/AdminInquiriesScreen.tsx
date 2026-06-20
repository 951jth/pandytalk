import {useAdminInquiriesQuery} from '@app/features/admin/hooks/useAdminInquiriesQuery'
import type {Inquiry} from '@app/features/admin/service/inquiryService'
import AppHeader from '@app/layout/AppHeader'
import COLORS from '@app/shared/constants/color'
import EmptyData from '@app/shared/ui/common/EmptyData'
import AdminInquiriesSkeleton from '@app/features/admin/components/AdminInquiriesSkeleton'
import React from 'react'
import {ActivityIndicator, FlatList, StyleSheet, Text, View} from 'react-native'
import {Icon} from 'react-native-paper'
import {useNavigation} from '@react-navigation/native'
import type {NativeStackNavigationProp} from '@react-navigation/native-stack'
import type {AppRouteParamList} from '@app/shared/types/navigate'
import PressableWrapper from '@app/shared/ui/common/PressableWrapper'

function AdminInquiryItem({item}: {item: Inquiry}) {
  const status = getInquiryStatus(item.status)
  const navigation = useNavigation<NativeStackNavigationProp<AppRouteParamList>>()

  return (
    <PressableWrapper
      style={styles.card}
      borderRadius={28}
      onPress={() =>
        navigation.navigate('admin-inquiry-detail', {inquiryId: item.id})
      }>
      <View style={styles.thumbnailSection}>
        <View style={styles.thumbnailCircle}>
          <Icon source="email-outline" size={30} color={COLORS.primary} />
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.email} numberOfLines={1}>
          {item.email || '-'}
        </Text>
        <Text style={styles.message} numberOfLines={2} ellipsizeMode="tail">
          {item.message || '-'}
        </Text>
      </View>

      <View style={styles.statusSection}>
        <View style={[styles.statusChip, {backgroundColor: status.bgColor}]}>
          <Text style={[styles.statusText, {color: status.textColor}]}>
            {status.text}
          </Text>
        </View>
      </View>
    </PressableWrapper>
  )
}

export default function AdminInquiriesScreen() {
  const {
    data,
    isLoading,
    isRefetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useAdminInquiriesQuery()
  const inquiries = data?.pages.flatMap(page => page.inquiries) ?? []

  return (
    <View style={styles.container}>
      <AppHeader title="문의 관리" />
      {isLoading && !inquiries.length ? (
        <AdminInquiriesSkeleton />
      ) : (
        <FlatList
          data={inquiries}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.inquiriesContainer}
          renderItem={({item}) => <AdminInquiryItem item={item} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <EmptyData text="문의 내역이 없습니다." />
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator color={COLORS.primary} />
              </View>
            ) : null
          }
          refreshing={isRefetching}
          onRefresh={refetch}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage()
          }}
          onEndReachedThreshold={0.5}
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
  inquiriesContainer: {
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 40,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  footerLoading: {
    paddingVertical: 16,
  },
  card: {
    flex: 1,
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
  thumbnailSection: {
    marginRight: 16,
  },
  thumbnailCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F9F9F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  infoSection: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 12,
  },
  email: {
    fontSize: 16,
    fontFamily: 'BMDOHYEON',
    color: '#2D2D2D',
    marginBottom: 8,
  },
  message: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'BMDOHYEON',
    color: COLORS.textSecondary,
    opacity: 0.75,
  },
  statusSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  statusChip: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  statusText: {
    fontFamily: 'BMDOHYEON',
    fontSize: 10,
  },
})

const getInquiryStatus = (status?: string) => {
  switch (status) {
    case 'pending':
      return {text: '대기중', textColor: '#E67E22', bgColor: '#FEF5ED'}
    case 'resolved':
    case 'done':
      return {text: '완료', textColor: '#27AE60', bgColor: '#EAF7EE'}
    case 'rejected':
    case 'closed':
      return {text: '종료', textColor: '#495057', bgColor: '#F1F3F5'}
    default:
      return {
        text: status || '-',
        textColor: COLORS.textSecondary,
        bgColor: '#F1F3F5',
      }
  }
}
