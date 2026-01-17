import Clipboard from '@react-native-clipboard/clipboard'
import React, {useCallback} from 'react'
import {
  Alert,
  Text,
  TouchableOpacity,
  type StyleProp,
  type TextStyle,
  type TouchableOpacityProps,
} from 'react-native'

type propTypes = {
  value: string
  wrapperStyle?: TouchableOpacityProps
  textStyle?: StyleProp<TextStyle>
}

export default function CopyableText({
  wrapperStyle,
  textStyle,
  value,
}: propTypes) {
  const handleCopy = useCallback(() => {
    Clipboard.setString(value)
    Alert.alert('복사 완료', '클립보드에 복사됐어요.')
  }, [value])

  return (
    <TouchableOpacity
      onPress={handleCopy}
      activeOpacity={0.7}
      {...wrapperStyle}>
      <Text style={textStyle}>{value}</Text>
    </TouchableOpacity>
  )
}
