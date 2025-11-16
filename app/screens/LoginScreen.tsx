import pandy from '@assets/images/pandy_visible.png'
import {getAuth, signInWithEmailAndPassword} from '@react-native-firebase/auth'
import {useNavigation} from '@react-navigation/native'
import type {NativeStackNavigationProp} from '@react-navigation/native-stack'
import React, {useState} from 'react'
import {Alert, Image, StyleSheet, TouchableOpacity, View} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {Button, Text} from 'react-native-paper'
import {SafeAreaView} from 'react-native-safe-area-context'
import KeyboardViewWrapper from '../components/container/KeyboardUtilitiesWrapper'
import EditInput from '../components/input/EditInput'
import PasswordInput from '../components/input/PasswordInput'
import COLORS from '../constants/color'
import type {AuthStackParamList} from '../types/navigate'
import {validateField} from '../utils/validation'

type formTypes = {
  email: string
  password: string
}

type errorsType = {
  email: string | null
  password: string | null
}

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

export default function LoginScreen() {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [errors, setErrors] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList, 'addGuest'>>()
  const authInstance = getAuth()
  const onSubmit = async () => {
    try {
      setLoading(true)
      // const {email, password} = formValues
      if (!email || !password) return
      await signInWithEmailAndPassword(authInstance, email, password)
    } catch (error: any) {
      handleFirebaseAuthError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleFirebaseAuthError = (error: any) => {
    let message = '알 수 없는 오류가 발생했습니다. 다시 시도해주세요.'
    console.log('error', error)
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
      case 'auth/user-not-found':
        // 해당 이메일 계정 없음
        message = `해당 이메일 계정이 없습니다.`
        break
      case 'auth/invalid-email':
        // 이메일 형식 잘못됨
        message = `이메일 형식 잘못됨`
        break
      case 'auth/user-disabled':
        // 계정이 비활성화됨
        message = `계정이 비활성화 됐습니다.`
        break
      // 필요시 추가
    }
    Alert.alert(message)
    // setError(message)
  }

  // const onFormChange = (key: string, value: string) => {
  //   setFormValues(old => ({...old, [key]: value}))
  // }

  const validateCheck = (key: 'email' | 'password', value: string) => {
    if (!key) return
    if (!value || value == '') {
      return setErrors(null)
    }
    const item = validationMap?.[key] || null
    if (!item) return
    const msg = validateField(item, value, item)
    setErrors(msg || null)
  }
  // const isBtnDisabled = hasAnyError(errors)
  return (
    <SafeAreaView style={{flex: 1}}>
      <KeyboardViewWrapper useTouchable={true}>
        <LinearGradient
          colors={['#A1C4FD', '#C2E9FB']}
          style={styles.container}>
          <Image source={pandy} style={styles.image} resizeMode="none" />
          {/* <Text style={styles.title}>어서오세요!</Text> */}
          <View style={styles.card}>
            <EditInput
              type="outlined"
              value={email}
              onChangeText={text => {
                setEmail(text)
                validateCheck('email', text)
              }}
              placeholder="이메일을 입력해주세요."
            />
            <PasswordInput
              type="outlined"
              value={password}
              onChangeText={text => {
                setPassword(text)
              }}
            />
            {errors && <Text style={styles.errorText}>{errors}</Text>}
            <Button
              onTouchEnd={onSubmit}
              mode="contained"
              style={styles.submitBtn}
              loading={loading}>
              로그인
            </Button>
          </View>
          <View style={styles.addOnRow}>
            <View style={styles.line}></View>
            <TouchableOpacity
              style={styles.addGuestButton}
              onPress={() => navigation.push('addGuest')}>
              <Text style={styles.addGuestText}>회원 가입</Text>
            </TouchableOpacity>
            <View style={styles.line}></View>
          </View>
        </LinearGradient>
      </KeyboardViewWrapper>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    // backgroundColor: COLORS.primary,
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.onPrimary,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1.5},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderRadius: 16,
    gap: 8,
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    fontFamily: 'BMDOHYEON',
    color: '#FFF',
  },
  submitBtn: {
    width: '100%',
    borderRadius: 8,
  },
  image: {
    width: 200,
    height: 200,
  },
  errorText: {
    color: 'red',
    fontFamily: 'BMDOHYEON',
    fontSize: 12,
  },
  addOnRow: {
    marginTop: 20,
    position: 'relative',
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  addGuestButton: {
    padding: 8,
    margin: -8,
  },
  line: {
    backgroundColor: '#FFF',
    // position: 'absolute',
    // left: 0,
    // top: 5,
    // width: '100%',
    height: 2,
    flex: 1,
  },
  addGuestText: {fontFamily: 'BMDOHYEON', color: '#FFF', zIndex: 1},
})
