import {
  checkRequiredTerm,
  defaultTermsRecord,
  type CheckedRecordType,
} from '@app/features/auth/constants/terms'
import {authRemote} from '@app/features/auth/data/authRemote.firebase'
import type {ProfileInputRef} from '@app/features/media/components/EditProfile'
import {userService} from '@app/features/user/service/userService'
import type {UserJoinRequest} from '@app/features/user/types/user'
import {InputFormRef} from '@app/shared/ui/form/InputForm'
import {handleFirebaseJoinError} from '@app/shared/utils/logger'
import type {AppDispatch} from '@app/store/store'
import {fetchUserById} from '@app/store/userSlice'
import type {FirebaseError} from 'firebase-admin'
import {useRef, useState} from 'react'
import {Alert} from 'react-native'
import {useDispatch} from 'react-redux'

export default function useUserJoinScreen() {
  const dispatch = useDispatch<AppDispatch>()
  const formRef = useRef<InputFormRef>(null)
  const profileRef = useRef<ProfileInputRef>(null)
  const [loading, setLoading] = useState(false)
  const [checkedRecord, setCheckedRecord] =
    useState<CheckedRecordType>(defaultTermsRecord)
  const btnDisable = checkRequiredTerm(checkedRecord)

  async function handleAddUser(formValues: UserJoinRequest) {
    try {
      setLoading(true)
      const {email, password} = formValues
      //1. firebase auth 생성
      const cred = await authRemote.createUserAuth(email, password)
      if (cred) {
        //2. 유저 프로필 생성
        const photoURL = await profileRef.current?.upload()
        const payload = {...formValues, photoURL}
        await userService.setProfile(cred, payload)
        //3. 가입 즉시 로그인이 유지되므로, 리덕스 상태를 강제로 갱신하여 AuthGate 통과 유도
        await dispatch(fetchUserById(cred.user.uid))

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
    handleAddUser,
  }
}
