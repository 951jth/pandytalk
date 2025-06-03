import React, {type ReactNode} from 'react'
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  useColorScheme,
  View,
} from 'react-native'

type propsType = {
  children: ReactNode
}

export default function NoLayout({children}: propsType): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark'
  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 0}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{flex: 1}}>{children}</View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  )
}
