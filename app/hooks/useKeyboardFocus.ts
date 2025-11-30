import {useEffect, useState} from 'react'
import {Keyboard} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

export default function useKeyboardFocus() {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false) //키보드 포커싱 유무
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const {bottom} = useSafeAreaInsets()

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', e => {
      setKeyboardVisible(true)
      setKeyboardHeight(e.endCoordinates?.height - bottom || 0)
    })
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false)
      setKeyboardHeight(0)
    })

    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

  const dismissKeyboard = () => Keyboard.dismiss() //키보드 포커싱 해제제

  return {isKeyboardVisible, dismissKeyboard, keyboardHeight, setKeyboardHeight}
}
