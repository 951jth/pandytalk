import React from 'react'
import {
  Keyboard,
  KeyboardAvoidingView,
  KeyboardAvoidingViewProps,
  Platform,
  TouchableWithoutFeedback,
  TouchableWithoutFeedbackProps,
  View,
} from 'react-native'

interface propTypes {
  children: React.ReactNode
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
      onPress={Keyboard.dismiss}
      accessible={false}
      {...touchableWithoutFeedback}>
      <View style={{flex: 1}}>
        <KeyboardAvoidingView
          style={{flex: 1}}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 0}
          {...keyboardAvoidingView}>
          {children}
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  )
}
