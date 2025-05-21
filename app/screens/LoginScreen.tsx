import React, {useState} from 'react'
import {StyleSheet, View} from 'react-native'
import {Button, Text, TextInput} from 'react-native-paper'
import CustomInput from '../components/common/CustomInput'

type formTypes = {
  id: string
  pwd: string
}

export default function LoginScreen() {
  const [formValues, setFormValues] = useState<formTypes>({id: null, pwd: null})
  const onSubmit = () => {
    // alert(JSON.stringify(formValues))
  }

  const onFormChange = (key: string, value: string) => {
    setFormValues(old => ({...old, [key]: value}))
  }

  console.log(formValues)
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>로그인 페이지</Text>
        <CustomInput
          label="ID"
          mode="outlined"
          onBlur={e => onFormChange('id', e)}
        />
        <CustomInput
          label="PASSWORD"
          mode="outlined"
          secureTextEntry
          right={<TextInput.Icon icon="eye" />}
          onBlur={e => onFormChange('pwd', e)}
        />
        <Button onTouchEnd={onSubmit}>로그인</Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'semibold',
    marginBottom: 20,
  },
})
