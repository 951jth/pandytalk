import {userService} from '@app/features/user/service/userService'
import type {User} from '@app/shared/types/auth'
import type {InputFormRef} from '@app/shared/ui/form/InputForm'
import type {ProfileInputRef} from '@app/shared/ui/upload/EditProfile'
import {useAppSelector} from '@app/store/reduxHooks'
import {useQueryClient} from '@tanstack/react-query'
import {useRef, useState} from 'react'
import {Alert} from 'react-native'

export const useUserManage = (onComplete: () => void) => {
  const queryClient = useQueryClient()
  const {data: user} = useAppSelector(state => state.user)
  const formRef = useRef<InputFormRef>(null)
  const profileRef = useRef<ProfileInputRef>(null)
  const [loadingStatus, setLoadingStatus] = useState<User['accountStatus'] | 'delete' | null>(null)
  const currentAdminUid = user?.uid

  const handleMemberStatusUpdate = async (
    status: User['accountStatus'] | 'delete',
  ) => {
    try {
      if (!status) return
      setLoadingStatus(status)
    if (status === 'delete') {
        return
      } else {
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
      }
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
