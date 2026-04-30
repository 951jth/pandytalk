import React, {useEffect, useState} from 'react'
import {
  Keyboard,
  KeyboardAvoidingView,
  KeyboardAvoidingViewProps,
  Platform,
  TouchableWithoutFeedback,
  TouchableWithoutFeedbackProps,
  View,
} from 'react-native'
interface KeyboardUtilitiesWrapperProps {
  children: React.ReactNode
  keyboardAvoidingViewProps?: KeyboardAvoidingViewProps
  touchableWithoutFeedbackProps?: TouchableWithoutFeedbackProps
  useTouchable?: boolean
  useAvoiding?: boolean
}
export default function KeyboardUtilitiesWrapper({
  children,
  keyboardAvoidingViewProps,
  touchableWithoutFeedbackProps,
  useTouchable = true,
  useAvoiding = true,
}: KeyboardUtilitiesWrapperProps) {
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', e => {
      setKeyboardHeight(e.endCoordinates?.height || 0)
    })
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0)
    })

    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

  const wrapChildren = (content: React.ReactNode) => {
    let result = content
    if (useAvoiding) {
      result =
        Platform.OS === 'ios' ? (
          <KeyboardAvoidingView
            behavior="padding"
            keyboardVerticalOffset={50} // Header 높이 고려
            style={{flex: 1}}
            {...keyboardAvoidingViewProps}>
            {result}
          </KeyboardAvoidingView>
        ) : (
          <View style={{flex: 1, paddingBottom: keyboardHeight}}>
            {result}
          </View>
        )
    }
    if (useTouchable) {
      result = (
        <TouchableWithoutFeedback
          onPress={Keyboard.dismiss}
          accessible={false}
          {...touchableWithoutFeedbackProps}>
          <View style={{flex: 1}}>{result}</View>
        </TouchableWithoutFeedback>
      )
    }
    return result
  }

  return wrapChildren(children)
}
