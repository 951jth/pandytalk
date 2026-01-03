import {setProfileItems} from '@app/features/user/screens/setProfiles.form'
import {userService} from '@app/features/user/service/userService'
import type {User} from '@app/shared/types/auth'
import type {InputFormRef} from '@app/shared/ui/form/InputForm'
import type {ProfileInputRef} from '@app/shared/ui/upload/EditProfile'
import {useAppSelector} from '@app/store/reduxHooks'
import {useRef} from 'react'
import {Alert} from 'react-native'

export const useUserDetail = (onComplete: () => void) => {
  const {data: user} = useAppSelector(state => state.user)
  const formRef = useRef<InputFormRef>(null)
  const profileRef = useRef<ProfileInputRef>(null)
  const currentAdminUid = user?.uid
  const formItems = setProfileItems(user)

  const handleMemberStatusUpdate = async (
    status: User['accountStatus'] & 'delete',
  ) => {
    try {
      if (!status) return
      if (status == 'delete') {
        return
      } else {
        const formValues = formRef?.current?.getValues() as User
        const photoURL = (await profileRef?.current?.upload()) ?? ''
        if (currentAdminUid)
          await userService.updateUserStatus(currentAdminUid, status, {
            ...formValues,
            photoURL,
          })
        Alert.alert('수정 완료', '유저 멤버 정보 수정 완료')
        onComplete?.()
      }
    } catch (e) {}
  }

  return {
    user,
    handleMemberStatusUpdate,
    formRef,
    profileRef,
  }
}
