import {AppRouteParamList} from '@app/navigation/types'
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native'
import {Timestamp} from '@react-native-firebase/firestore'
import dayjs from 'dayjs'
import {useEffect, useState} from 'react'
import {Alert, Linking} from 'react-native'
import {useAdminInquiryQuery} from './useAdminInquiryQuery'
import {useDeleteInquiryMutation} from './useDeleteInquiryMutation'
import {useUpdateInquiryStatusMutation} from './useUpdateInquiryStatusMutation'

type AdminInquiryDetailRouteProp = RouteProp<AppRouteParamList, 'admin-inquiry-detail'>

export const useAdminInquiryDetail = () => {
  const route = useRoute<AdminInquiryDetailRouteProp>()
  const navigation = useNavigation()
  const inquiryId = route.params.inquiryId
  const {
    data: inquiry,
    isLoading,
    isError,
    refetch,
  } = useAdminInquiryQuery(inquiryId)

  const {mutateAsync: updateStatusAsync, isPending: isUpdating} =
    useUpdateInquiryStatusMutation()
  const {mutateAsync: deleteInquiryAsync, isPending: isDeleting} =
    useDeleteInquiryMutation()
  const [currentStatus, setCurrentStatus] = useState<string>()

  useEffect(() => {
    setCurrentStatus(inquiry?.status)
  }, [inquiry?.status])

  const formattedDate =
    inquiry?.createdAt instanceof Timestamp
      ? dayjs(inquiry.createdAt.toDate()).format('YYYY.MM.DD HH:mm')
      : '-'

  const handleUpdateStatus = (newStatus: string) => {
    if (!inquiry) return

    Alert.alert(
      '상태 변경',
      '문의 상태를 완료 처리하시겠습니까?',
      [
        {text: '취소', style: 'cancel'},
        {
          text: '확인',
          onPress: async () => {
            try {
              await updateStatusAsync({id: inquiry.id, status: newStatus})
              setCurrentStatus(newStatus)
              Alert.alert('성공', '상태가 변경되었습니다.')
            } catch {
              Alert.alert('오류', '상태 변경 중 문제가 발생했습니다.')
            }
          },
        },
      ],
      {cancelable: true},
    )
  }

  const handleEmailPress = async () => {
    if (!inquiry?.email) return

    const subject = encodeURIComponent('[Pandytalk] 문의하신 내용에 대한 답변입니다.')
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

  const handleDelete = () => {
    if (!inquiry) return

    Alert.alert(
      '문의 삭제',
      '이 문의를 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.',
      [
        {text: '취소', style: 'cancel'},
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteInquiryAsync(inquiry.id)
              Alert.alert('삭제 완료', '문의가 삭제되었습니다.', [
                {text: '확인', onPress: () => navigation.goBack()},
              ])
            } catch (error) {
              Alert.alert(
                '삭제 실패',
                error instanceof Error
                  ? error.message
                  : '문의 삭제 중 문제가 발생했습니다.',
              )
            }
          },
        },
      ],
      {cancelable: true},
    )
  }

  const isResolved = currentStatus === 'resolved' || currentStatus === 'done'
  const isPending = isUpdating || isDeleting

  return {
    inquiry,
    isLoading,
    isError,
    refetch,
    formattedDate,
    currentStatus,
    isResolved,
    isPending,
    isDeleting,
    handleUpdateStatus,
    handleEmailPress,
    handleDelete,
  }
}
