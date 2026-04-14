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
import {useNavigation} from '@react-navigation/native'
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
  const navigation = useNavigation()

  async function handleAddGuest(formValues: UserJoinRequest) {
    try {
      setLoading(true)
      const {email, password} = formValues
      //1. firebase auth 생성
      const cred = await authRemote.createUserAuth(email, password)
      if (cred) {
        //2. 유저 프로필 생성
        const photoURL = await profileRef.current?.upload()
        let payload = {...formValues, photoURL}
        await userService.setProfile(cred, payload)
        // await authRemote.signOut() // 더 이상 가입 즉시 로그아웃하지 않음 (pending 상태로 진입 허용)
        Alert.alert(
          '가입 신청 완료',
          '승인 대기 중입니다. 승인 전까지는 일부 기능이 제한될 수 있습니다.',
        )
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
