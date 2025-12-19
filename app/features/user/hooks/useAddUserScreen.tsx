import type {CheckedRecordType} from '@app/features/auth/components/TermAgreementList'
import {authRemote} from '@app/features/auth/data/authRemote.firebase'
import {userRemote} from '@app/features/user/data/userRemote.firebase'
import {
  checkRequiredTerm,
  defaultTermsRecord,
} from '@app/shared/constants/terms'
import {useLogout} from '@app/shared/hooks/useLogout'
import type {UserJoinRequest} from '@app/shared/types/auth'
import {InputFormRef} from '@app/shared/ui/form/InputForm'
import type {ProfileInputRef} from '@app/shared/ui/upload/EditProfile'
import {useRef, useState} from 'react'
import {Alert} from 'react-native'

export default function useAddUserScreen() {
  const formRef = useRef<InputFormRef | null>(null)
  const profileRef = useRef<ProfileInputRef | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkedRecord, setCheckedRecord] =
    useState<CheckedRecordType>(defaultTermsRecord)
  const btnDisable = checkRequiredTerm(checkedRecord)
  const {logout} = useLogout() //로그아웃 공용 훅

  async function handleAddGuest(formValues: UserJoinRequest) {
    try {
      setLoading(true)
      const res = await authRemote.signUp({...formValues})
      console.log('res', res)
      if (res.ok) {
        Alert.alert(
          '성공',
          '관리자 확인 후 승인이 완료되면\n게스트로 입장할 수 있습니다.',
        )
        const photoURL = await profileRef.current?.upload()
        console.log('photoURL', photoURL)
        if (res.uid && photoURL)
          await userRemote.updateProfile(res.uid, {photoURL})
        //요청 등록시 auth 가 세팅되서 다시 로그인해제
        await logout()
        formRef?.current?.resetValues()
      } else {
        Alert.alert('실패', res.message)
      }
    } catch (e) {
      console.log(e)
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
