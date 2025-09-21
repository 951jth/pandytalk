// components/inputs/PasswordInput.tsx
import React, {useState} from 'react'
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
  ...others
}: PasswordInputProps) {
  const [show, setShow] = useState(false)

  return (
    <EditInput
      style={[style]}
      // EditInput과 동일한 룩앤필
      type={type}
      // password 동작
      secureTextEntry={secureTextEntry ?? !show}
      autoCapitalize="none"
      autoCorrect={false}
      textContentType="password"
      placeholder="비밀번호를 입력해주세요."
      // right={
      //   <TextInput.Icon
      //     icon={show ? 'eye-off' : 'eye'}
      //     onPress={() => setShow(v => !v)}
      //     // 포커스 유지
      //     forceTextInputFocus
      //     accessibilityLabel={show ? '비밀번호 숨기기' : '비밀번호 보기'}
      //   />
      // }
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
