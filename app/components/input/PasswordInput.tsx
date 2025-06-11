import React, {useState} from 'react'
import {TextInput, TextInputProps} from 'react-native-paper'
import CustomInput from './CustomInput'

interface propTypes {
  props: TextInputProps
}
export function PasswordInput(props: TextInputProps) {
  const [showPassword, setShowPassword] = useState(false)
  return (
    <CustomInput
      label="PASSWORD"
      secureTextEntry={!showPassword}
      right={
        <TextInput.Icon
          icon={showPassword ? 'eye-off' : 'eye'}
          onPress={() => setShowPassword(prev => !prev)}
        />
      }
      {...props}
    />
  )
}
