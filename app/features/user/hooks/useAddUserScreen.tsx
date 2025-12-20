import type {CheckedRecordType} from '@app/features/auth/components/TermAgreementList'
import {authRemote} from '@app/features/auth/data/authRemote.firebase'
import {userService} from '@app/features/user/service/userService'
import {
  checkRequiredTerm,
  defaultTermsRecord,
} from '@app/shared/constants/terms'
import {useLogout} from '@app/shared/hooks/useLogout'
import type {UserJoinRequest} from '@app/shared/types/auth'
import {InputFormRef} from '@app/shared/ui/form/InputForm'
import type {ProfileInputRef} from '@app/shared/ui/upload/EditProfile'
import {handleFirebaseJoinError} from '@app/shared/utils/logger'
import type {FirebaseError} from 'firebase-admin'
import {useRef, useState} from 'react'
import {Alert} from 'react-native'
const debug = true

export default function useAddUserScreen() {
  const formRef = useRef<InputFormRef>(null)
  const profileRef = useRef<ProfileInputRef>(null)
  const [loading, setLoading] = useState(false)
  const [checkedRecord, setCheckedRecord] =
    useState<CheckedRecordType>(defaultTermsRecord)
  const btnDisable = checkRequiredTerm(checkedRecord)
  const {logout} = useLogout() //로그아웃 공용 훅
  async function handleAddGuest(formValues: UserJoinRequest) {
    try {
      setLoading(true)
      const {email, password} = formValues
      //1. firebase auth 생성
      const cred = await authRemote.createUserAuth(email, password)
      if (cred) {
        console.log('profileRef.current', profileRef.current)
        //2. 유저 프로필 생성
        const photoURL = await profileRef.current?.upload()
        console.log('photoURL', photoURL)
        let payload = {...formValues, photoURL}
        await userService.setProfile(cred, payload)
        await logout()
        formRef?.current?.resetValues()
      } else {
        Alert.alert(
          '실패',
          '유저 신청에 실패하였습니다. 네트워크를 확인해주세요.',
        )
      }
    } catch (e) {
      const err = e as FirebaseError
      Alert.alert('실패', handleFirebaseJoinError(err))
    } finally {
      setLoading(false)
    }
  }

  return {
    formRef,
    profileRef,
    loading,
    checkedRecord,
    setCheckedRecord,
    btnDisable,
    handleAddGuest,
  }
}
