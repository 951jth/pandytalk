import AppHeader from '@app/layout/AppHeader'
import COLORS from '@app/shared/constants/color'
import {AppRouteParamList} from '@app/shared/types/navigate'
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native'
import React, {useState} from 'react'
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native'
import {Icon} from 'react-native-paper'
import dayjs from 'dayjs'
import {useUpdateInquiryStatusMutation} from '@app/features/admin/hooks/useUpdateInquiryStatusMutation'
import {Timestamp} from '@react-native-firebase/firestore'

type AdminInquiryDetailRouteProp = RouteProp<AppRouteParamList, 'admin-inquiry-detail'>

export default function AdminInquiryDetailScreen() {
  const route = useRoute<AdminInquiryDetailRouteProp>()
  const navigation = useNavigation()
  const inquiry = route.params.inquiry

  const {mutate: updateStatus, isPending} = useUpdateInquiryStatusMutation()
  const [currentStatus, setCurrentStatus] = useState(inquiry.status)

  const formattedDate =
    inquiry.createdAt instanceof Timestamp
      ? dayjs(inquiry.createdAt.toDate()).format('YYYY.MM.DD HH:mm')
      : '-'

  const handleUpdateStatus = (newStatus: string) => {
    Alert.alert(
      '상태 변경',
      '문의 상태를 완료 처리하시겠습니까?',
      [
        {text: '취소', style: 'cancel'},
        {
          text: '확인',
          onPress: () => {
            updateStatus(
              {id: inquiry.id, status: newStatus},
              {
                onSuccess: () => {
                  setCurrentStatus(newStatus)
                  Alert.alert('성공', '상태가 변경되었습니다.')
                },
                onError: () => {
                  Alert.alert('오류', '상태 변경 중 문제가 발생했습니다.')
                },
              },
            )
          },
        },
      ],
      {cancelable: true},
    )
  }

  const handleEmailPress = async () => {
    if (!inquiry.email) return

    const subject = encodeURIComponent(`[Pandytalk] 문의하신 내용에 대한 답변입니다.`)
    const body = encodeURIComponent(
      `안녕하세요.\n\n문의하신 내용에 대한 답변을 드립니다.\n\n\n\n---\n[원본 문의 내용]\n${inquiry.message || ''}`,
    )
    const mailtoUrl = `mailto:${inquiry.email}?subject=${subject}&body=${body}`

    try {
      const supported = await Linking.canOpenURL(mailtoUrl)
      if (supported) {
        await Linking.openURL(mailtoUrl)
      } else {
        Alert.alert('알림', '이메일 앱을 열 수 없습니다.')
      }
    } catch (error) {
      Alert.alert('오류', '이메일 앱을 여는 중 문제가 발생했습니다.')
    }
  }

  const isResolved = currentStatus === 'resolved' || currentStatus === 'done'

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
