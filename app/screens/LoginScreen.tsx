import auth from '@react-native-firebase/auth'
import React, {useState} from 'react'
import {StyleSheet, View} from 'react-native'
import {Button, Text, TextInput} from 'react-native-paper'
import CustomInput from '../components/common/CustomInput'

type formTypes = {
  email: string
  password: string
}

export default function LoginScreen() {
  const [formValues, setFormValues] = useState<formTypes>({
    email: '',
    password: '',
  })
  const onSubmit = async () => {
    try {
      // alert(JSON.stringify(formValues))
      const {email, password} = formValues
      await auth().signInWithEmailAndPassword(email, password)
    } catch (e) {
      console.log('error', e)
    }
  }

  const onFormChange = (key: string, value: string) => {
    setFormValues(old => ({...old, [key]: value}))
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>로그인 페이지</Text>
      <CustomInput
        label="ID"
        mode="outlined"
        onChangeText={e => {
          onFormChange('email', e)
        }}
      />
      <CustomInput
        label="PASSWORD"
        mode="outlined"
        secureTextEntry
        right={<TextInput.Icon icon="eye" />}
        onChangeText={e => onFormChange('password', e)}
      />
      <Button onTouchEnd={onSubmit} mode="contained" style={styles.submitBtn}>
        로그인
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'semibold',
    marginBottom: 20,
  },
  submitBtn: {
    marginTop: 20,
    width: '100%',
  },
})
