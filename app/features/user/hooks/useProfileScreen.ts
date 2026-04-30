import * as Updates from 'expo-updates'
import {getFirestore} from '@react-native-firebase/firestore'
import {useQueryClient} from '@tanstack/react-query'
import {cloneDeep} from 'lodash'
import {useCallback, useMemo, useRef, useState} from 'react'
import {Alert} from 'react-native'
import {useDispatch} from 'react-redux'

import {createUserProfileItems} from '@app/features/user/screens/setProfiles.form'
import {userService} from '@app/features/user/service/userService'
import {type User} from '@app/shared/types/auth'
import {type UpdateInput} from '@app/shared/types/firebase'
import {ProfileInputRef} from '@app/shared/ui/upload/EditProfile'
import useKeyboardFocus from '../../../shared/hooks/useKeyboardFocus'
import {InputFormRef} from '../../../shared/ui/form/InputForm'
import {useAppSelector} from '../../../store/reduxHooks'
import {AppDispatch} from '../../../store/store'
import {fetchUserById} from '../../../store/userSlice'

/**
 * 프로필 정보 조회 및 업데이트를 담당하는 메인 훅
 * (메뉴 관련 기능은 useProfileMenu 훅으로 이관됨)
 */
export function useProfileScreen() {
  const {data: user} = useAppSelector(state => state.user)
  const userInfo = useMemo(() => cloneDeep(user), [user])
  const [submitting, setSubmitting] = useState<boolean>(false)
  const dispatch = useDispatch<AppDispatch>()
  const queryClient = useQueryClient()
  const uid = userInfo?.uid
  const profileRef = useRef<ProfileInputRef | null>(null)
  const formRef = useRef<InputFormRef>(null)
  const {keyboardHeight} = useKeyboardFocus()
  const formItems = useMemo(() => createUserProfileItems(userInfo), [userInfo])

  const updateUserProfile = async () => {
    try {
      const ok = formRef?.current?.validate()
      if (!ok) return

      if (userInfo?.authority === 'TEST') {
        Alert.alert('알림', 'TEST 계정은 프로필을 수정할 수 없습니다.')
        return
      }

      const formValues = formRef.current?.getValues() || {}
      if (!uid) throw new Error('로그인된 사용자가 없습니다.')

      setSubmitting(true)
      const firestore = getFirestore()
      const newPhotoURL = await profileRef?.current?.upload()

      const payload: UpdateInput<User> = {
        displayName: formValues.displayName
          ? String(formValues.displayName).trim()
          : (user?.displayName ?? ''),
        intro: formValues.intro
          ? String(formValues.intro).trim()
          : (user?.intro ?? ''),
        photoURL: newPhotoURL ?? user?.photoURL ?? null,
      }

      await userService.fetchProfile(uid, payload)
      await dispatch(fetchUserById(uid))
      formRef.current?.updateSavePoint() // 세이브포인트 갱신
      queryClient.invalidateQueries({queryKey: ['users']})
      firestore.clearPersistence()
      Alert.alert('성공', '프로필 정보가 저장되었습니다.')
    } catch (e) {
      console.error('Update error:', e)
      Alert.alert('오류', '저장 중 문제가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const onReset = useCallback(() => {
    formRef.current?.resetValues()
    profileRef.current?.onReset()
  }, [])

  const showDebugInfo = useCallback(() => {
    Alert.alert(
      '🛠️ Debug Information',
      `Update ID: ${Updates.updateId || 'None (Local Build)'}\n` +
        `Runtime Version: ${Updates.runtimeVersion || 'N/A'}\n` +
        `Channel: ${Updates.channel || 'N/A'}\n` +
        `Created At: ${
          Updates.createdAt ? Updates.createdAt.toLocaleString() : 'N/A'
        }\n` +
        `Is Embedded: ${Updates.isEmbeddedLaunch ? 'Yes' : 'No'}`,
    )
  }, [])

  return {
    userInfo,
    submitting,
    keyboardHeight,
    formItems,
    formRef,
    profileRef,
    updateUserProfile,
    onReset,
    showDebugInfo,
  }
}
