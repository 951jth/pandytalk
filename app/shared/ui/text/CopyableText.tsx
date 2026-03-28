import {FONTS} from '@app/shared/constants/font'
import Clipboard from '@react-native-clipboard/clipboard'
import React, {useCallback} from 'react'
import {
  Alert,
  Platform,
  Text,
  TouchableOpacity,
  type StyleProp,
  type TextStyle,
  type TouchableOpacityProps,
} from 'react-native'

type propTypes = TouchableOpacityProps & {
  value: string
  textStyle?: StyleProp<TextStyle>
  longPressDelayMs?: number
}

const androidConfig = {
  includeFontPadding: false,
  textAlignVertical: 'center',
} as const

export default function CopyableText({
  textStyle,
  value,
  longPressDelayMs = 300,
  ...rest
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
      {...rest}>
      <Text
        style={[
          {
            fontFamily: FONTS.regular,
            ...Platform.select({
              android: androidConfig,
            }),
          },
          textStyle,
        ]}>
        {value}
      </Text>
    </TouchableOpacity>
  )
}
