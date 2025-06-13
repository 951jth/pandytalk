import React, {useEffect, useState} from 'react'
import {
  Keyboard,
  KeyboardAvoidingView,
  KeyboardAvoidingViewProps,
  Platform,
  TouchableWithoutFeedback,
  TouchableWithoutFeedbackProps,
} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
interface propTypes {
  children: React.ReactNode
  keyboardAvoidingView?: KeyboardAvoidingViewProps
  touchableWithoutFeedback?: TouchableWithoutFeedbackProps
  useTouchable?: boolean
  useAvoiding?: boolean
  addOffset?: number
}
export default function KeyboardUtilitiesWrapper({
  children,
  keyboardAvoidingView,
  touchableWithoutFeedback,
  useTouchable = true,
  useAvoiding = true,
  addOffset = 0, //현재는 안드로이드만
}: propTypes) {
  // const [keyboardOffset, setKeyboardOffset] = useState(addOffset)
  const insets = useSafeAreaInsets()
  const statusTopHeight = insets.top
  const statusBottomHeight = insets.bottom || 0
  const [layoutFixKey, setLayoutFixKey] = useState<boolean>(false)

  useEffect(() => {
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setLayoutFixKey(prev => !prev) // 강제 리렌더 트리거
    })

    return () => hideSub.remove()
  }, [])

  const wrapChildren = (children: React.ReactNode) => {
    let WrappedChildren = children
    if (useTouchable) {
      WrappedChildren = (
        <TouchableWithoutFeedback
          onPress={Keyboard.dismiss}
          accessible={false}
          {...touchableWithoutFeedback}>
          {WrappedChildren}
        </TouchableWithoutFeedback>
      )
    }
    if (useAvoiding) {
      WrappedChildren = (
        <KeyboardAvoidingView
          key={`avoiding-${layoutFixKey}`}
          style={{flex: 1}}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 0}
          // keyboardVerticalOffset={keyboardOffset}
          {...keyboardAvoidingView}>
          {WrappedChildren}
        </KeyboardAvoidingView>
      )
    }
    return WrappedChildren
  }

  return wrapChildren(children)
}
