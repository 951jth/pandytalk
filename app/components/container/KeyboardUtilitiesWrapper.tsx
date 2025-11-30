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
interface propTypes {
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
}: propTypes) {
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

  const wrapChildren = (children: React.ReactNode) => {
    let WrappedChildren = children
    if (useAvoiding) {
      WrappedChildren =
        Platform.OS === 'ios' ? (
          <KeyboardAvoidingView
            behavior="padding"
            keyboardVerticalOffset={50} // Header 높이 고려
            style={{flex: 1}}
            {...keyboardAvoidingViewProps}>
            {WrappedChildren}
          </KeyboardAvoidingView>
        ) : (
          <View style={{flex: 1, paddingBottom: keyboardHeight}}>
            {WrappedChildren}
          </View>
        )
    }
    if (useTouchable) {
      WrappedChildren = (
        <TouchableWithoutFeedback
          onPress={Keyboard.dismiss}
          accessible={false}
          {...touchableWithoutFeedbackProps}>
          {WrappedChildren}
        </TouchableWithoutFeedback>
      )
    }
    return WrappedChildren
  }

  return wrapChildren(children)
}
