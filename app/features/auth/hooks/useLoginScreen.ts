import {auth} from '@app/shared/firebase/firestore'
import {AuthStackParamList} from '@app/shared/types/navigate'
import {validateField} from '@app/shared/utils/validation'
import {signInWithEmailAndPassword} from '@react-native-firebase/auth'
import {useNavigation} from '@react-navigation/native'
import {NativeStackNavigationProp} from '@react-navigation/native-stack'
import {useEffect, useState} from 'react'
import {Alert} from 'react-native'

const validationMap = {
  email: {
    key: 'email',
    pattern: /^.{8,32}$/, // 길이 8~32자
    message: '현재 입력한 비밀번호와 다릅니다.',
    validation: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: '이메일 형식이 올바르지 않습니다.',
      customFn: (v: string) => {
        if (!v) return '이메일을 입력하세요.'
        if (v !== v.trim()) return '앞뒤 공백을 제거해주세요.'
        return true
      },
    },
  },
  password: {
    key: 'password',
    pattern: /^.{8,32}$/, // 길이 8~32자
    message: '비밀번호는 8-32자여야 합니다.',
    customFn: (v: string) => {
      if (!v) return '비밀번호를 입력하세요.'
      if (!/[A-Za-z]/.test(v) || !/[0-9]/.test(v))
        return '영문과 숫자를 모두 포함하세요.'
      if (/\s/.test(v)) return '공백은 사용할 수 없습니다.'
      return true
    },
  },
}

const handleFirebaseAuthError = (error: any) => {
  let message = '알 수 없는 오류가 발생했습니다. 다시 시도해주세요.'
  switch (error?.code) {
    case 'auth/invalid-email':
      message = '이메일 형식이 올바르지 않습니다.'
      break
    case 'auth/user-not-found':
      message = '등록되지 않은 이메일입니다.'
      break
    case 'auth/wrong-password':
      message = '비밀번호가 일치하지 않습니다.'
      break
    case 'auth/user-disabled':
      message = '이 계정은 비활성화되어 있습니다.'
      break
    case 'auth/too-many-requests':
      message = '잠시 후 다시 시도해주세요. 요청이 너무 많습니다.'
      break
    case 'auth/invalid-credential':
      // 잘못된 이메일/비밀번호
      message = `잘못된 이메일/비밀번호 입니다.`
      break
    // 필요시 추가
  }
  Alert.alert(message)
  // setError(message)
}

export function useLoginScreen() {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [errors, setErrors] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList, 'addGuest'>>()

  const onSubmit = async () => {
    try {
      setLoading(true)
      // const {email, password} = formValues
      if (!email || !password) return
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      handleFirebaseAuthError(error)
    } finally {
      setLoading(false)
    }
  }

  const validateCheck = (key: 'email' | 'password', value: string) => {
    if (!key) return
    if (!value || value == '') {
      return setErrors(null)
    }
    const item = validationMap?.[key] || null
    if (!item) return
    const msg = validateField(item, value, {email, password})
    setErrors(msg || null)
  }

  const moveJoinPage = () => navigation.push('addGuest')

  useEffect(() => {
    if (email) validateCheck('email', email)
  }, [email])

  useEffect(() => {
    if (password) validateCheck('password', password)
  }, [password])

  return {
    email,
    setEmail,
    password,
    setPassword,
    errors,
    loading,
    onSubmit,
    moveJoinPage,
  }
}
