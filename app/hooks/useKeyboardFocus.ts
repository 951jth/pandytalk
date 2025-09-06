import {useEffect, useState} from 'react'
import {Keyboard} from 'react-native'

export default function useKeyboardFocus() {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false) //키보드 포커싱 유무
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true),
    )
    const hideSub = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    )

    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

  const dismissKeyboard = () => Keyboard.dismiss() //키보드 포커싱 해제제

  return {isKeyboardVisible, dismissKeyboard}
}
