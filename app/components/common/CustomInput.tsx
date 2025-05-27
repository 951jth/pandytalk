import React from 'react'
import {StyleSheet} from 'react-native'
import {TextInput, TextInputProps} from 'react-native-paper'

export default function CustomInput(props: TextInputProps): React.JSX.Element {
  return <TextInput {...props} style={[styles.input, props.style]} />
}

const styles = StyleSheet.create({
  input: {
    minWidth: 330,
    width: '100%',
    height: 50,
  },
})
