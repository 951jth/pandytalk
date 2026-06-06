import {useState} from 'react'
import {Alert, Linking} from 'react-native'
import {RouteProp, useRoute} from '@react-navigation/native'
import dayjs from 'dayjs'
import {Timestamp} from '@react-native-firebase/firestore'
import {useUpdateInquiryStatusMutation} from './useUpdateInquiryStatusMutation'
import {AppRouteParamList} from '@app/shared/types/navigate'

type AdminInquiryDetailRouteProp = RouteProp<AppRouteParamList, 'admin-inquiry-detail'>

export const useAdminInquiryDetail = () => {
  const route = useRoute<AdminInquiryDetailRouteProp>()
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

  return {
    inquiry,
    formattedDate,
    currentStatus,
    isResolved,
    isPending,
    handleUpdateStatus,
    handleEmailPress,
  }
}
