// components/inputs/PasswordInput.tsx
import React from 'react'
import {StyleSheet} from 'react-native'
import EditInput, {type EditInputProps} from './EditInput'

export type PasswordInputProps = EditInputProps & {
  label?: string
  type?: 'outlined' | 'borderless'
}

export default function PasswordInput({
  style,
  secureTextEntry, // 외부에서 강제하고 싶다면 사용 가능 (내부 토글이 우선)
  type = 'borderless',
  outlineStyle,
  ...others
}: PasswordInputProps) {
  return (
    <EditInput
      style={[style, styles.input]}
      // EditInput과 동일한 룩앤필
      type={type}
      outlineStyle={outlineStyle}
      // password 동작
      secureTextEntry={secureTextEntry}
      autoCapitalize="none"
      autoCorrect={false}
      textContentType="password"
      placeholder="비밀번호를 입력해주세요."
      {...others}
    />
  )
}

const styles = StyleSheet.create({
  input: {
    // width: '100%',
    // backgroundColor: 'transparent',
    // borderBottomWidth: 0,
    // paddingHorizontal: 0,
    // height: 40,
    // fontSize: 14,
    // fontFamily: 'Roboto',
    // color: '#111',
  },
})
