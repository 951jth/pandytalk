import React from 'react'
import {
  Keyboard,
  KeyboardAvoidingView,
  KeyboardAvoidingViewProps,
  Platform,
  TouchableWithoutFeedback,
  TouchableWithoutFeedbackProps,
} from 'react-native'

interface propTypes {
  children: React.JSX.Element
  keyboardAvoidingView?: KeyboardAvoidingViewProps
  touchableWithoutFeedback?: TouchableWithoutFeedbackProps
}
export default function KeyboardViewWrapper({
  children,
  keyboardAvoidingView,
  touchableWithoutFeedback,
}: propTypes) {
  return (
    <TouchableWithoutFeedback
      style={{flex: 1}}
      onPress={Keyboard.dismiss}
      accessible={false}
      {...touchableWithoutFeedback}>
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 0}
        {...keyboardAvoidingView}>
        {children}
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  )
}
