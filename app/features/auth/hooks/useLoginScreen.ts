import {authService} from '@app/features/auth/service/authService'
import {AuthStackParamList} from '@app/shared/types/navigate'
import {validateField} from '@app/shared/utils/validation'
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
      await authService.login(email, password)
    } catch (error: any) {
      Alert.alert(error)
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
