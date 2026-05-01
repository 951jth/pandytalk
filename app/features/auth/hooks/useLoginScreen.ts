import {authService} from '@app/features/auth/service/authService'
import {AuthStackParamList} from '@app/shared/types/navigate'
import {validateField} from '@app/shared/utils/validation'
import {useNavigation} from '@react-navigation/native'
import {NativeStackNavigationProp} from '@react-navigation/native-stack'
import {useCallback, useState} from 'react'
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

export function useLoginScreen() {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [errors, setErrors] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  // 필드가 많아지면 객체 방식이 편함:
  // const [touched, setTouched] = useState({email: false, password: false})
  const [blurredEmail, setBlurredEmail] = useState(false)
  const [blurredPassword, setBlurredPassword] = useState(false)
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList, 'user-join'>>()

  const validateCheck = useCallback(
    (key: 'email' | 'password', value: string) => {
      const item = validationMap?.[key] || null
      if (!item) return null
      const msg = validateField(item, value, {email, password})
      const nextError = msg || null
      setErrors(nextError)
      return nextError
    },
    [email, password],
  )

  const setEmailValue = useCallback(
    (value: string) => {
      setEmail(value)
      if (blurredEmail) {
        validateCheck('email', value)
      }
    },
    [blurredEmail, validateCheck],
  )

  const setPasswordValue = useCallback(
    (value: string) => {
      setPassword(value)
      if (blurredPassword) {
        validateCheck('password', value)
      }
    },
    [blurredPassword, validateCheck],
  )

  const onEmailBlur = useCallback(() => {
    // 객체 방식: setTouched(prev => ({...prev, email: true}))
    setBlurredEmail(true)
    validateCheck('email', email)
  }, [email, validateCheck])

  const onPasswordBlur = useCallback(() => {
    // 객체 방식: setTouched(prev => ({...prev, password: true}))
    setBlurredPassword(true)
    validateCheck('password', password)
  }, [password, validateCheck])

  const validateAll = useCallback(() => {
    // 객체 방식: setTouched({email: true, password: true})
    setBlurredEmail(true)
    setBlurredPassword(true)

    const emailError = validateCheck('email', email)
    if (emailError) return emailError

    return validateCheck('password', password)
  }, [email, password, validateCheck])

  const onSubmit = async () => {
    const validationError = validateAll()
    if (validationError) return

    try {
      setLoading(true)
      await authService.login(email, password)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다.'
      Alert.alert('로그인 실패', message)
    } finally {
      setLoading(false)
    }
  }

  const moveJoinPage = () => navigation.push('user-join')

  return {
    email,
    setEmail: setEmailValue,
    password,
    setPassword: setPasswordValue,
    errors,
    loading,
    onEmailBlur,
    onPasswordBlur,
    onSubmit,
    moveJoinPage,
  }
}
