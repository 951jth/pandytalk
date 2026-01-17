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
  longPressDelayMs?: number
}

export default function CopyableText({
  wrapperStyle,
  textStyle,
  value,
  longPressDelayMs = 300,
}: propTypes) {
  const handleCopy = useCallback(() => {
    Alert.alert(
      '텍스트 복사',
      '클립보드에 복사 하시겠어요?',
      [
        {text: '취소', style: 'cancel'},
        {
          text: '복사',
          style: 'destructive',
          onPress: () => Clipboard.setString(value),
        },
      ],
      {cancelable: true},
    )
  }, [value])

  return (
    <TouchableOpacity
      onPress={() => {}}
      onLongPress={handleCopy}
      delayLongPress={longPressDelayMs}
      activeOpacity={0.7}
      {...wrapperStyle}>
      <Text style={textStyle}>{value}</Text>
    </TouchableOpacity>
  )
}
