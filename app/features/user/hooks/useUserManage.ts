import {userService} from '@app/features/user/service/userService'
import type {User} from '@app/shared/types/auth'
import type {InputFormRef} from '@app/shared/ui/form/InputForm'
import type {ProfileInputRef} from '@app/shared/ui/upload/EditProfile'
import {useAppSelector} from '@app/store/reduxHooks'
import {useQueryClient} from '@tanstack/react-query'
import {useRef, useState} from 'react'
import {Alert} from 'react-native'

type UseUserManageParams = {
  record?: User
  onComplete: () => void
}

export const useUserManage = ({record, onComplete}: UseUserManageParams) => {
  const queryClient = useQueryClient()
  const {data: user} = useAppSelector(state => state.user)
  const formRef = useRef<InputFormRef>(null)
  const profileRef = useRef<ProfileInputRef>(null)
  const [loadingStatus, setLoadingStatus] = useState<
    User['accountStatus'] | 'delete' | null
  >(null)
  const currentAdminUid = user?.uid

  const deleteSelectedUser = async () => {
    try {
      if (!currentAdminUid || !record) return
      setLoadingStatus('delete')
      await userService.deleteUserByAdmin(currentAdminUid, record)
      await queryClient.invalidateQueries({queryKey: ['users']})
      Alert.alert('삭제 완료', '유저 삭제 요청이 완료되었습니다.')
      onComplete?.()
    } catch (e) {
      console.error('유저 삭제 중 오류:', e)
      Alert.alert(
        '삭제 실패',
        e instanceof Error ? e.message : '유저 삭제 중 오류가 발생했습니다.',
      )
    } finally {
      setLoadingStatus(null)
    }
  }

  const handleMemberStatusUpdate = async (
    status: User['accountStatus'] | 'delete',
  ) => {
    if (status === 'delete') {
      Alert.alert(
        '유저 삭제',
        '이 유저의 계정과 프로필 정보를 삭제합니다. 계속할까요?',
        [
          {text: '취소', style: 'cancel'},
          {
            text: '삭제',
            style: 'destructive',
            onPress: deleteSelectedUser,
          },
        ],
      )
      return
    }

    try {
      if (!status) return
      setLoadingStatus(status)
      const formValues = formRef?.current?.getValues() as User
      const photoURL = (await profileRef?.current?.upload()) ?? ''
      if (currentAdminUid)
        await userService.updateUserStatus(currentAdminUid, status, {
          ...formValues,
          photoURL,
        })
      await queryClient.invalidateQueries({queryKey: ['users']})
      Alert.alert('수정 완료', '유저 멤버 정보 수정 완료')
      onComplete?.()
    } catch (e) {
      console.error('유저 멤버 정보 수정 중 오류:', e)
    } finally {
      setLoadingStatus(null)
    }
  }

  return {
    user,
    isLoading: !!loadingStatus,
    loadingStatus,
    handleMemberStatusUpdate,
    formRef,
    profileRef,
  }
}
