import AppHeader from '@app/layout/AppHeader'
import COLORS from '@app/shared/constants/color'
import React from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import {Icon} from 'react-native-paper'
import {useAdminInquiryDetail} from '@app/features/admin/hooks/useAdminInquiryDetail'

export default function AdminInquiryDetailScreen() {
  const {
    inquiry,
    formattedDate,
    isResolved,
    isPending,
    handleUpdateStatus,
    handleEmailPress,
  } = useAdminInquiryDetail()

  return (
    <View style={styles.container}>
      <AppHeader title="문의 상세" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.headerSection}>
            <View style={styles.iconCircle}>
              <Icon source="email-outline" size={32} color={COLORS.primary} />
            </View>
            <View style={styles.headerInfo}>
              <TouchableOpacity onPress={handleEmailPress}>
                <Text style={styles.emailText} selectable>
                  {inquiry.email || '이메일 없음'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.dateText}>{formattedDate}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                isResolved ? styles.statusBadgeResolved : styles.statusBadgePending,
              ]}>
              <Text
                style={[
                  styles.statusText,
                  isResolved ? styles.statusTextResolved : styles.statusTextPending,
                ]}>
                {isResolved ? '완료' : '대기중'}
              </Text>
            </View>
          </View>

          <View style={styles.metaDataSection}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>문의 유형</Text>
              <Text style={styles.metaValue}>{inquiry.type || '-'}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>유입 경로</Text>
              <Text style={styles.metaValue}>{inquiry.source || '-'}</Text>
            </View>
          </View>

          <View style={styles.messageSection}>
            <Text style={styles.messageLabel}>문의 내용</Text>
            <View style={styles.messageBox}>
              <Text style={styles.messageText} selectable>
                {inquiry.message || '내용 없음'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 하단 고정 액션 버튼 */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            isResolved ? styles.actionButtonDisabled : styles.actionButtonPrimary,
          ]}
          disabled={isResolved || isPending}
          onPress={() => handleUpdateStatus('resolved')}>
          <Text style={styles.actionButtonText}>
            {isPending ? '처리중...' : isResolved ? '완료된 문의입니다' : '완료 처리'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // 하단 바 공간 확보
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F9F9F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  emailText: {
    fontSize: 18,
    fontFamily: 'BMDOHYEON',
    color: '#2D2D2D',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'BMDOHYEON',
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgePending: {
    backgroundColor: '#FEF5ED',
  },
  statusBadgeResolved: {
    backgroundColor: '#EAF7EE',
  },
  statusText: {
    fontFamily: 'BMDOHYEON',
    fontSize: 12,
  },
  statusTextPending: {
    color: '#E67E22',
  },
  statusTextResolved: {
    color: '#27AE60',
  },
  metaDataSection: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F3F5',
    paddingVertical: 16,
    marginBottom: 20,
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaLabel: {
    width: 80,
    fontSize: 14,
    fontFamily: 'BMDOHYEON',
    color: COLORS.textSecondary,
  },
  metaValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'BMDOHYEON',
    color: '#2D2D2D',
  },
  messageSection: {
    flex: 1,
  },
  messageLabel: {
    fontSize: 16,
    fontFamily: 'BMDOHYEON',
    color: '#2D2D2D',
    marginBottom: 12,
  },
  messageBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    minHeight: 150,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'BMDOHYEON',
    color: '#495057',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
    paddingBottom: 32, // SafeArea 고려
  },
  actionButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonPrimary: {
    backgroundColor: COLORS.primary,
  },
  actionButtonDisabled: {
    backgroundColor: '#E9ECEF',
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: 'BMDOHYEON',
    color: COLORS.white,
  },
})
