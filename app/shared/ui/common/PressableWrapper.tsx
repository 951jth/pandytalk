import type {ReactNode} from 'react'
import React from 'react'
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
  StyleSheet,
} from 'react-native'

type propTyps = {
  children: ReactNode
  style?: StyleProp<ViewStyle>
} & PressableProps

export default function PressableWrapper({
  children,
  style,
  ...rest
}: propTyps) {
  // style에서 borderRadius를 추출하여 Pressable의 터치 영역 곡률에 반영 (안드로이드 리플 대응)
  const flattenedStyle = (StyleSheet.flatten(style) || {}) as ViewStyle
  const borderRadius = flattenedStyle.borderRadius ?? 0

  return (
    <Pressable
      {...rest}
      accessibilityRole="button"
      style={({pressed}) => [
        {
          borderRadius, // 전달된 곡률과 동일하게 터치 영역 설정
          transform: [{scale: pressed ? 0.99 : 1}], // 아주 미세하고 고급스러운 눌림 효과
          opacity: pressed ? 0.9 : 1, // 부드러운 투명도 변화
        },
        style,
      ]}>
      {children}
    </Pressable>
  )
}
