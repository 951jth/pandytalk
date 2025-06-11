import pandy from '@assets/images/pandy_visible.png'
import auth from '@react-native-firebase/auth'
import React, {useState} from 'react'
import {Image, StyleSheet, View} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {Button, Text} from 'react-native-paper'
import {SafeAreaView} from 'react-native-safe-area-context'
import KeyboardViewWrapper from '../components/container/KeyboardUtilitiesWrapper'
import CustomInput from '../components/input/CustomInput'
import {PasswordInput} from '../components/input/PasswordInput'
import COLORS from '../constants/color'

type formTypes = {
  email: string
  password: string
}

export default function LoginScreen() {
  const [formValues, setFormValues] = useState<formTypes>({
    email: '',
    password: '',
  })
  const [error, setError] = useState<String | null>('')
  const [loading, setLoading] = useState<boolean>(false)
  const onSubmit = async () => {
    try {
      setLoading(true)
      const {email, password} = formValues
      await auth().signInWithEmailAndPassword(email, password)
    } catch (error: any) {
      handleFirebaseAuthError(error)
    } finally {
      setLoading(false)
    }
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
      // 필요시 추가
    }
    setError(message)
  }

  const onFormChange = (key: string, value: string) => {
    setFormValues(old => ({...old, [key]: value}))
  }

  return (
    <SafeAreaView style={{flex: 1}}>
      <KeyboardViewWrapper>
        <LinearGradient
          colors={['#A1C4FD', '#C2E9FB']}
          style={styles.container}>
          <Image source={pandy} style={styles.image} resizeMode="none" />
          {/* <Text style={styles.title}>어서오세요!</Text> */}
          <View style={styles.card}>
            <CustomInput
              label="이메일"
              mode="outlined"
              onChangeText={e => {
                onFormChange('email', e)
              }}
            />
            <PasswordInput
              mode="outlined"
              onChangeText={e => onFormChange('password', e)}
            />
            <Text style={styles.errorText}>{error}</Text>
            <Button
              onTouchEnd={onSubmit}
              mode="contained"
              style={styles.submitBtn}
              loading={loading}>
              로그인
            </Button>
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
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    fontFamily: 'BMDOHYEON',
    color: '#FFF',
  },
  submitBtn: {
    marginTop: 20,
    width: '100%',
    borderRadius: 8,
  },
  image: {
    width: 200,
    height: 200,
  },
  errorText: {
    color: 'red',
  },
})
