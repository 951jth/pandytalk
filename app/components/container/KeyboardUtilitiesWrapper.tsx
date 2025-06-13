import React, {useEffect} from 'react'
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
  const statusBottomHeight = insets.bottom

  useEffect(() => {
    //현재 일부 기기에서 keyboardAvoidingView 포커싱후 bottom이 높게뜨는 이슈가 있음
    //해결 방법 찾는중
    const showSub = Keyboard.addListener('keyboardDidShow', e => {
      // 키보드 높이에 따라 동적으로 offset 적용
      const offset = Platform.OS === 'ios' ? 50 : addOffset
      // setKeyboardOffset(offset)
    })
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      // setKeyboardOffset(0 - statusBottomHeight)
    })
    return () => {
      showSub.remove()
      hideSub.remove()
    }
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
          style={{flex: 1}}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : addOffset}
          {...keyboardAvoidingView}>
          {WrappedChildren}
        </KeyboardAvoidingView>
      )
    }
    return WrappedChildren
  }

  return wrapChildren(children)
}
