import {getFirestore, serverTimestamp} from '@react-native-firebase/firestore'
import {useQueryClient} from '@tanstack/react-query'
import {cloneDeep} from 'lodash'
import {useMemo, useRef, useState} from 'react'
import {Alert} from 'react-native'
import {useDispatch} from 'react-redux'

import {messageLocal} from '@app/features/chat/data/messageLocal.sqlite'
import {messageMigrate} from '@app/features/chat/data/messagLocal.migrate'
import {messageTestService} from '@app/features/chat/service/messageTestService'
import {setProfileItems} from '@app/features/user/screens/setProfiles.form'
import {userService} from '@app/features/user/service/userService'
import {ProfileInputRef} from '@app/shared/ui/upload/EditProfile'
import useKeyboardFocus from '../../../shared/hooks/useKeyboardFocus'
import {InputFormRef} from '../../../shared/ui/form/InputForm'
import {useAppSelector} from '../../../store/reduxHooks'
import {AppDispatch} from '../../../store/store'
import {fetchUserById} from '../../../store/userSlice'

export function useProfileScreen() {
  const {data: user} = useAppSelector(state => state.user)
  const userInfo = useMemo(() => cloneDeep(user), [user])
  const [submitting, setSubmitting] = useState<boolean>(false)
  const dispatch = useDispatch<AppDispatch>()
  const queryClient = useQueryClient()
  const uid = userInfo?.uid
  const profileRef = useRef<ProfileInputRef | null>(null)
  const formRef = useRef<InputFormRef>(null)
  const {keyboardHeight, setKeyboardHeight} = useKeyboardFocus()
  const formItems = useMemo(() => setProfileItems(userInfo), [userInfo])

  const updateUserProfile = async () => {
    try {
      const ok = formRef?.current?.validate()
      if (!ok) return

      const formValues = formRef.current?.getValues() || {}
      if (!uid) throw new Error('로그인된 사용자가 없습니다.')

      setSubmitting(true)
      const firestore = getFirestore()
      const newPhotoURL = await profileRef?.current?.upload()

      const payload: any = {
        displayName: formValues.displayName
          ? String(formValues.displayName).trim()
          : (user?.displayName ?? ''),
        intro: formValues.intro
          ? String(formValues.intro).trim()
          : (user?.intro ?? ''),
        photoURL: newPhotoURL ?? user?.photoURL ?? null,
        updatedAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
      }

      // await updateDoc(userRef, payload)
      await userService.fetchProfile(uid, payload)
      await dispatch(fetchUserById(uid))
      queryClient.invalidateQueries({queryKey: ['users']})
      firestore.clearPersistence()
      Alert.alert('성공', '프로필 정보가 저장되었습니다.')
    } catch (err) {
      console.error('프로필 업데이트 실패:', err)
      Alert.alert('오류', '프로필 정보 저장에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const onClear = () => {
    Alert.alert(
      '로컬 캐시 재동기화',
      '로컬에 저장된 메시지/캐시를 초기화하고 서버에서 다시 불러옵니다.\n(서버 데이터는 삭제되지 않습니다)',
      [
        {text: '취소', style: 'cancel'},
        {
          text: '초기화',
          style: 'destructive',
          onPress: async () => {
            try {
              await messageLocal.clearAllMessages()
              await messageMigrate.initMessageTable() // init이 async면 await 필수
              queryClient.clear()
              const allMessages = await messageLocal.getAllMessages()
              console.log('all messages: ', allMessages)
              Alert.alert('완료', '로컬 캐시를 초기화했습니다.')
            } catch (e: any) {
              Alert.alert('초기화 실패', e?.message ?? '초기화 실패!')
            }
          },
        },
      ],
    )
  }
  const onMigrateTest = () => {
    try {
      messageTestService.migrateToLatest(2)
    } catch (e) {
      console.log(e)
    }
  }

  return {
    userInfo,
    submitting,
    keyboardHeight,
    formItems,
    formRef,
    profileRef,
    updateUserProfile,
    onClear,
    onMigrateTest,
  }
}
