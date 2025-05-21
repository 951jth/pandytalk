import React, {useState} from 'react'
import {StyleSheet, View} from 'react-native'
import {Button, Text, TextInput} from 'react-native-paper'

type formTypes = {
  id: string
  pwd: string
}

export default function LoginScreen() {
  const [formValues, setFormValues] = useState<formTypes>({id: null, pwd: null})
  const onSubmit = () => {
    // alert(JSON.stringify(formValues))
  }
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>로그인 페이지</Text>
        <TextInput />
        <TextInput
          label="Password"
          secureTextEntry
          right={<TextInput.Icon icon="eye" />}
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
  },
})
