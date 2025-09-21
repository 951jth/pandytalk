import React, {useRef, useState} from 'react'
import {Alert, StyleSheet, View} from 'react-native'
import {Text} from 'react-native-paper'
import {SafeAreaView} from 'react-native-safe-area-context'
import {useDispatch} from 'react-redux'
import KeyboardUtilitiesWrapper from '../components/container/KeyboardUtilitiesWrapper'
import InputForm from '../components/form/InputForm'
import EditInput from '../components/input/EditInput'
import EditTextArea from '../components/input/EditTextarea'
import PasswordInput from '../components/input/PasswordInput'
import AppHeader from '../components/navigation/AppHeader'
import EditProfile, {
  type profileInputRef,
} from '../components/upload/EditProfile'
import COLORS from '../constants/color'
import {submitSignupRequest} from '../services/authService'
import type {AppDispatch} from '../store/store'
import {logout} from '../store/userSlice'
import type {requestUser} from '../types/auth'
import type {FormItem} from '../types/form'

const initialData = {
  email: '',
  password: '',
  displayName: '',
  note: '',
  intro: '',
}

export default function AddGuestScreen() {
  const [previewUrl, setPreviewUrl] = useState<string | null>('')
  const profileRef = useRef<profileInputRef | null>(null)
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch<AppDispatch>()
  const formRef = useRef<any | null>(null)
  const items: FormItem[] = [
    {
      key: 'email',
      label: '이메일',
      required: true,
      validation: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: '이메일 형식이 올바르지 않습니다.',
        customFn: (v: string) => {
          if (!v) return '이메일을 입력하세요.'
          if (v !== v.trim()) return '앞뒤 공백을 제거해주세요.'
          return true
        },
      },
      render: (value, onChange) => (
        <EditInput
          value={value}
          onChangeText={onChange}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="이메일을 입력해주세요."
        />
      ),
    },
    {
      key: 'password',
      label: '비밀번호',
      required: true,
      validation: {
        pattern: /^.{8,32}$/, // 길이 8~32자
        message: '비밀번호는 8–32자여야 합니다.',
        customFn: (v: string) => {
          if (!v) return '비밀번호를 입력하세요.'
          if (!/[A-Za-z]/.test(v) || !/[0-9]/.test(v))
            return '영문과 숫자를 모두 포함하세요.'
          if (/\s/.test(v)) return '공백은 사용할 수 없습니다.'
          return true
        },
      },
      render: (value, onChange) => (
        <PasswordInput value={value} onChangeText={onChange} />
      ),
    },
    {
      key: 'passwordCheck',
      label: `비밀번호\n확인`,
      required: true,
      validation: {
        pattern: /^.{8,32}$/, // 길이 8~32자
        message: '현재 입력한 비밀번호와 다릅니다.',
        customFn: (v: string, allValues: any) => {
          console.log('v', v)
          console.log('allValues', allValues)
          return allValues?.password == v
        },
      },
      render: (value, onChange) => (
        <PasswordInput value={value} onChangeText={onChange} />
      ),
    },
    {
      key: 'displayName',
      label: '닉네임',
      required: true,
      validation: {
        maxLength: 20,
        pattern: /^[A-Za-z0-9가-힣 _-]{2,20}$/,
        message: '닉네임은 2-20자, 한글/영문/숫자/공백/_/-만 허용됩니다.',
        customFn: (v: string) => {
          if (!v) return '닉네임을 입력하세요.'
          if (v.trim().length < 2)
            return '닉네임은 공백 제외 2자 이상이어야 합니다.'
          if (/^\s|\s$/.test(v)) return '앞/뒤 공백은 제거해주세요.'
          return true
        },
      },
      render: (value, onChange) => (
        <EditInput value={value} onChangeText={onChange} />
      ),
    },
    {
      key: 'note',
      label: '신청메모',
      required: true,
      validation: {
        maxLength: 200,
        message: '신청메모는 1-200자 입력해주세요.',
        customFn: (v: string) => {
          if (!v || v.trim().length === 0) return '신청메모를 입력하세요.'
          return true
        },
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
  ]

  async function handleAddGuest(formValues: requestUser) {
    try {
      const photoURL = await profileRef.current?.getImage()
      setLoading(true)
      const res = await submitSignupRequest({...formValues, photoURL})
      if (res.ok) {
        Alert.alert(
          '성공',
          '관리자 확인 후 승인이 완료되면\n게스트로 입장할 수 있습니다.',
        )
        //요청 등록시 auth 가 세팅되서 다시 로그인해제
        await logout(dispatch)
        formRef.current.resetValues()
      } else {
        Alert.alert('실패', res.message)
      }
    } catch (e) {
      console.log(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="게스트 신청" />
      <KeyboardUtilitiesWrapper>
        <View style={styles.inner}>
          <InputForm
            ref={formRef}
            editable={true}
            items={items}
            buttonLabel="게스트 신청"
            topElement={
              <View style={styles.profileWrap}>
                <EditProfile
                  edit={true}
                  defaultUrl={previewUrl}
                  // setPreviewUrl={setPreviewUrl}
                  boxSize={100}
                  iconSize={75}
                />
                <Text style={styles.notiText}>
                  {`관리자 확인 후 승인이 완료되면\n게스트로 입장할 수 있습니다.`}
                </Text>
              </View>
            }
            style={styles.inputForm}
            initialValues={initialData}
            onSubmit={handleAddGuest}
            loading={loading}
          />
        </View>
      </KeyboardUtilitiesWrapper>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.outerColor,
  },
  inner: {
    padding: 8,
    flex: 1,
    // backgroundColor: COLORS.background,
  },
  innerContents: {
    flex: 1,
    padding: 24,
    backgroundColor: COLORS.background,
  },
  inputForm: {
    borderRadius: 16,
    // // ✅ 그림자 효과 (iOS + Android 호환)
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3, // Android 전용 그림자
  },
  profileWrap: {
    flexDirection: 'column',
    alignContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  notiText: {
    color: COLORS.error,
    fontFamily: 'BMDOHYEON',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 12,
  },
})
