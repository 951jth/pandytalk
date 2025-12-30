import {getAuth} from '@react-native-firebase/auth'
import {
  doc,
  getFirestore,
  serverTimestamp,
  updateDoc,
} from '@react-native-firebase/firestore'
import {useQueryClient} from '@tanstack/react-query'
import dayjs from 'dayjs'
import {cloneDeep} from 'lodash'
import React, {useMemo, useRef, useState} from 'react'
import {Alert, StyleSheet, View} from 'react-native'
import {Button, IconButton} from 'react-native-paper'
import {useDispatch} from 'react-redux'

import {messageLocal} from '@app/features/chat/data/messageLocal.sqlite'
import COLORS from '@app/shared/constants/color'
import {authority} from '@app/shared/constants/korean'
import {FormItem} from '@app/shared/types/form'
import {CustomButton} from '@app/shared/ui/button/CustomButton'
import EditInput from '@app/shared/ui/input/EditInput'
import EditTextArea from '@app/shared/ui/input/EditTextarea'
import EditProfile, {ProfileInputRef} from '@app/shared/ui/upload/EditProfile'
import {initialUserInfo} from '../../../services/userService'
import useKeyboardFocus from '../../../shared/hooks/useKeyboardFocus'
import InputForm, {InputFormRef} from '../../../shared/ui/form/InputForm'
import {useAppSelector} from '../../../store/reduxHooks'
import {AppDispatch} from '../../../store/store'
import {fetchUserById} from '../../../store/userSlice'
import WithdrawalButton from '../../user/components/WithdrawalButton'
// somewhere like App.tsx or a test screen

const authInstance = getAuth()

export default function ProfileScreen(): React.JSX.Element {
  const {data: user} = useAppSelector(state => state.user)
  const userInfo = useMemo(() => cloneDeep(user), [user])
  const [submitting, setSubmitting] = useState<boolean>(false)
  const dispatch = useDispatch<AppDispatch>()
  const queryClient = useQueryClient()
  const uid = authInstance.currentUser?.uid
  const profileRef = useRef<ProfileInputRef | null>(null)
  const formRef = useRef<InputFormRef>(null)
  const {keyboardHeight, setKeyboardHeight} = useKeyboardFocus()

  const formItems: FormItem[] = useMemo(
    () => [
      {
        label: '닉네임',
        key: 'displayName',
        render: (value, onChange, edit) => (
          <EditInput value={value} onChangeText={onChange} />
        ),
        validation: {
          // 2~20자, 한글/영문/숫자/공백/언더스코어/_-/만 허용
          maxLength: 20,
          pattern: /^[A-Za-z0-9가-힣 _-]{2,20}$/,
          message:
            '닉네임은 2-20자, 한글/영문/숫자/공백/언더스코어/하이픈만 가능합니다.',
          customFn: (v: string) => {
            if (!v) return '닉네임을 입력하세요.'
            if (v.trim().length < 2)
              return '닉네임은 공백 제외 2자 이상이어야 합니다.'
            if (/^\s|\s$/.test(v)) return '앞/뒤 공백은 제거해주세요.'
            return true // 통과
          },
        },
      },
      {label: '이메일', key: 'email', contents: user?.email},
      // {label: '그룹', key: 'groupName', contents: user?.groupName},
      {
        label: '권한',
        key: 'authority',
        contents: user?.authority ? authority?.[user?.authority] : '-',
      },
      {
        key: 'intro',
        label: '소개',
        validation: {
          maxLength: 200,
          message: '소개는 최대 200자입니다.',
        },
        render: (value, onChange) => (
          <EditTextArea
            value={value}
            onChangeText={onChange}
            minRows={1}
            maxRows={6}
            maxLength={200}
          />
        ),
      },
      {
        label: '최근 접속일',
        key: 'lastSeen',
        contents: dayjs(Number(user?.lastSeen))?.format('YYYY-MM-DD hh:mm:ss'),
      },
    ],
    [user?.authority],
  )
  // const initialFormValues = {
  //   // ...user,
  //   uid,
  //   authority: 'USER',
  //   email: user?.email ?? '',
  //   isGuest: true,
  //   lastSeen: serverTimestamp(),
  //   displayName: user?.email,
  //   photoURL: '',
  //   status: 'online',
  // } //초기값이 없는 경우 강제로넣어줌

  const updateUserProfile = async () => {
    try {
      const ok = formRef?.current?.validate()
      if (!ok) return

      const formValues = formRef.current?.getValues() || {}
      if (!uid) throw new Error('로그인된 사용자가 없습니다.')
      if (!user) initialUserInfo(uid as string, dispatch)

      setSubmitting(true)
      const firestore = getFirestore()
      const userRef = doc(firestore, 'users', uid)
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

      await updateDoc(userRef, payload)

      const profile = await dispatch(fetchUserById(uid))
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

  const onClean = async () => {
    try {
      await messageLocal.clearAllMessages()
      messageLocal.initMessageTable()
      queryClient.clear()
      const allMessages = await messageLocal.getAllMessages()
      console.log('all messages: ', allMessages)
    } catch (e: any) {
      Alert.alert(e?.message ?? '초기화 실패!')
    }
  }
  // 테스트용: 버튼 클릭 시 강제 크래시
  // const forceCrash = () => {
  //   crashlytics().log('Test crash button clicked')
  //   crashlytics().crash() // 강제 크래시
  // }

  return (
    <View style={[styles.container, {paddingBottom: keyboardHeight}]}>
      <Button icon="close" onPress={onClean} style={styles.cleanButton}>
        캐시 초기화
      </Button>
      <IconButton
        icon="refresh"
        size={20}
        style={styles.resetBtn}
        onTouchEnd={() => {
          formRef?.current?.resetValues()
          profileRef?.current?.onReset()
        }}
      />
      <View style={styles.contents}>
        <InputForm
          items={formItems}
          formData={userInfo}
          formKey={userInfo?.uid || ''}
          layout={{
            labelStyle: {width: 100},
          }}
          ref={formRef}
          topElement={
            <View style={styles.profileWrap}>
              <EditProfile
                edit={true}
                ref={profileRef}
                defaultUrl={userInfo?.photoURL}
              />
            </View>
          }
          bottomElement={
            <View style={styles.buttons}>
              <CustomButton loading={submitting} onTouchEnd={updateUserProfile}>
                프로필 저장
              </CustomButton>
              {userInfo?.authority !== 'ADMIN' && <WithdrawalButton />}
            </View>
          }
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    position: 'relative',
  },
  contents: {
    flexGrow: 1,
    borderRadius: 8,
    marginBottom: 16,
    // backgroundColor: 'skyblue',
    backgroundColor: COLORS.background,
    // 그림자 스타일 (iOS + Android)
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3, // Android 그림자
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  buttons: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    gap: 8,
  },
  profileWrap: {
    flexDirection: 'column',
    alignContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cleanButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
  },
  resetBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
})
