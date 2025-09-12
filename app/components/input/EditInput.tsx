import React, {useState} from 'react'
import {StyleSheet} from 'react-native'
import {Text, TextInput, TextInputProps} from 'react-native-paper'
import COLORS from '../../constants/color'

// ✅ 커스텀 prop(edit)을 포함한 타입 정의
interface EditInputProps extends TextInputProps {
  edit?: boolean
}

export default function EditInput({
  edit = true,
  style,
  ...others
}: EditInputProps): React.JSX.Element {
  const [focused, setFocused] = useState<boolean>(false)
  return edit ? (
    <TextInput
      style={[styles.input, focused && styles.focusedInput, style]}
      underlineColor="transparent"
      activeUnderlineColor="transparent"
      mode="flat"
      {...others}
      onFocus={e => {
        setFocused(true)
        others?.onFocus?.(e)
      }}
      onBlur={e => {
        setFocused(false)
        others?.onBlur && others?.onBlur(e)
      }}
    />
  ) : (
    <Text style={styles.fixedText}>
      {others?.value || others?.defaultValue || '-'}
    </Text>
  )
}

const styles = StyleSheet.create({
  input: {
    width: '100%',
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    paddingHorizontal: 0,
    height: 40,
    fontSize: 14,
    fontFamily: 'Roboto',
  },
  focusedInput: {
    borderBottomWidth: 3,
    borderColor: COLORS.primary,
    marginBottom: 4,
    paddingBottom: 0,
    // marginBottom: 4,
  },
  fixedText: {
    fontFamily: 'BMDOHYEON',
    color: '#5D5D5D',
    fontSize: 12,
  },
})
