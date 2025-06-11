import {getAuth} from '@react-native-firebase/auth'
import {doc, getFirestore, updateDoc} from '@react-native-firebase/firestore'
import storage from '@react-native-firebase/storage'
import {useQueryClient} from '@tanstack/react-query'
import dayjs from 'dayjs'
import {cloneDeep} from 'lodash'
import React, {useEffect, useState} from 'react'
import {Alert, StyleSheet, View} from 'react-native'
import {useDispatch} from 'react-redux'
import InputForm from '../components/description/InputForm'
import EditProfile from '../components/upload/EditProfile'
import COLORS from '../constants/color'
import {authority} from '../constants/korean'
import {initialUserInfo} from '../services/userService'
import {useAppSelector} from '../store/hooks'
import {AppDispatch} from '../store/store'
import {fetchUserById} from '../store/userSlice'
import {isLocalFile} from '../utils/file'

const authInstance = getAuth()

export default function ProfileScreen(): React.JSX.Element {
  const {data: user, loading, error} = useAppSelector(state => state.user)
  const [formValues, setFormValues] = useState<object | null>()
  const [edit, setEdit] = useState<boolean>(false)
  const [photoURL, setPhotoURL] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>('')
  const dispatch = useDispatch<AppDispatch>()
  const queryClient = useQueryClient()
  const uid = authInstance.currentUser?.uid

  const formItems = [
    {label: '닉네임', key: 'nickname'},
    {label: '이메일', key: 'email', fixed: true},
    {
      label: '권한',
      contents: user?.authority ? authority?.[user?.authority] : '-',
    },
    {
      label: '최근 접속일',
      contents: dayjs(Number(user?.lastSeen))?.format('YYYY-MM-DD hh:mm:ss'),
    },
    {label: '게스트 여부', contents: user?.isGuest ? 'Y' : 'N'},
  ]
  const initialFormValues = {
    uid,
    authority: 'USER',
    email: user?.email ?? '',
    isGuest: true,
    lastSeen: Date.now(),
    nickname: '',
    photoURL: '',
    status: 'online',
  } //초기값이 없는 경우 강제로넣어줌

  const updateUserProfile = async (formValues: object) => {
    try {
      if (!uid) throw new Error('로그인된 사용자가 없습니다.')
      setSubmitting(true)
      const firestore = getFirestore()
      const userRef = doc(firestore, 'users', uid)
      if (previewUrl && isLocalFile(previewUrl)) {
        const fileName = `profile_${Date.now()}.jpg`
        const ref = storage().ref(`profiles/${uid}/${fileName}`)
        await ref.putFile(previewUrl)
        const newPhotoURL = await ref.getDownloadURL()
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
    if (!user) {
      //새로등록한 유저의 경우 초기값설정해서 등록해줌
      initialUserInfo(uid as string, dispatch)
    }
    setFormValues(user as object)
    if (user?.photoURL) setPreviewUrl(user.photoURL)
  }, [user])

  return (
    <View style={styles.container}>
      <View style={styles.contents}>
        <InputForm
          items={formItems}
          initialData={formValues}
          editable={true}
          buttonLabel="프로필 "
          topElement={
            <View style={styles.profileWrap}>
              <EditProfile
                edit={edit}
                previewUrl={previewUrl}
                setPreviewUrl={setPreviewUrl}
              />
            </View>
          }
          edit={edit}
          setEdit={bool => {
            setEdit(bool)
            setFormValues(cloneDeep(formValues))
            if (!bool && user?.photoURL) setPreviewUrl(user.photoURL)
          }}
          loading={submitting}
          onSubmit={formValues => updateUserProfile(formValues)}
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
  },
  profileWrap: {
    flexDirection: 'column',
    alignContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
})
