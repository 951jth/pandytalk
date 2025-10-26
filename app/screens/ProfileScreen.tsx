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
import React, {useEffect, useMemo, useRef, useState} from 'react'
import {Alert, StyleSheet, View} from 'react-native'
import {Button, IconButton} from 'react-native-paper'
import {useDispatch} from 'react-redux'
import InputForm, {InputFormRef} from '../components/form/InputForm'
import EditInput from '../components/input/EditInput'
import EditProfile, {
  type profileInputRef,
} from '../components/upload/EditProfile'
import COLORS from '../constants/color'
import {authority} from '../constants/korean'
import {useResetAllQueryCache} from '../hooks/useCommonQuery'
import {initialUserInfo} from '../services/userService'
import {useAppSelector} from '../store/reduxHooks'
import {AppDispatch} from '../store/store'
import {fetchUserById} from '../store/userSlice'
import type {FormItem} from '../types/form'

const authInstance = getAuth()

export default function ProfileScreen(): React.JSX.Element {
  const {data: user, loading, error} = useAppSelector(state => state.user)
  const userInfo = useMemo(() => cloneDeep(user), [user])
  const [formValues, setFormValues] = useState<object | null>()
  const [edit, setEdit] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>('')
  const dispatch = useDispatch<AppDispatch>()
  const queryClient = useQueryClient()
  const uid = authInstance.currentUser?.uid
  const profileRef = useRef<profileInputRef | null>(null)
  const formRef = useRef<InputFormRef | null>(null)
  const {resetAll} = useResetAllQueryCache()

  const formItems: FormItem[] = [
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
      label: '최근 접속일',
      key: 'lastSeen',
      contents: dayjs(Number(user?.lastSeen))?.format('YYYY-MM-DD hh:mm:ss'),
    },
  ]
  const initialFormValues = {
    // ...user,
    uid,
    authority: 'USER',
    email: user?.email ?? '',
    isGuest: true,
    lastSeen: serverTimestamp(),
    displayName: user?.email,
    photoURL: '',
    status: 'online',
  } //초기값이 없는 경우 강제로넣어줌

  const updateUserProfile = async (formValues: object) => {
    try {
      if (!uid) throw new Error('로그인된 사용자가 없습니다.')
      if (!user) initialUserInfo(uid as string, dispatch)
      setSubmitting(true)
      const firestore = getFirestore()
      const userRef = doc(firestore, 'users', uid)
      const newPhotoURL = await profileRef?.current?.upload()
      if (newPhotoURL) {
        formValues = {
          ...initialFormValues,
          ...formValues,
          photoURL: newPhotoURL,
        }
      }
      await updateDoc(userRef, {
        ...formValues,
      })
      const profile = await dispatch(fetchUserById(uid))
      queryClient.invalidateQueries({queryKey: ['users']}) //유저 조회 쿼리갱신
      Alert.alert('성공', '프로필 정보가 저장되었습니다.')
    } catch (err) {
      console.error('프로필 업데이트 실패:', err)
      Alert.alert('오류', '프로필 정보 저장에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    // setFormValues(user as object)
    if (userInfo?.photoURL) setPreviewUrl(userInfo.photoURL)
  }, [userInfo])

  return (
    <View style={styles.container}>
      <View style={styles.contents}>
        <InputForm
          items={formItems}
          formData={userInfo}
          editable={true}
          labelWidth={100}
          buttonLabel="프로필 저장"
          initialValues={initialFormValues}
          topElement={
            <View style={styles.profileWrap}>
              <EditProfile
                edit={true}
                ref={profileRef}
                // previewUrl={previewUrl}
                defaultUrl={previewUrl}
                // setPreviewUrl={setPreviewUrl}
              />
            </View>
          }
          edit={true}
          loading={submitting}
          onSubmit={formValues => updateUserProfile(formValues)}
          ref={formRef}
        />
        <Button icon="close" onTouchEnd={resetAll} style={styles.cleanButton}>
          캐시 초기화
        </Button>
        <IconButton
          icon="refresh"
          size={20}
          style={styles.resetBtn}
          onTouchEnd={() => {
            formRef.current?.resetValues()
          }}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  contents: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 8,
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
  profileWrap: {
    flexDirection: 'column',
    alignContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cleanButton: {
    position: 'absolute',
    top: 5,
    left: 0,
  },
  resetBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
})
