import type {ReactNode} from 'react'
import React from 'react'
import {
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

type propTyps = {
  children: ReactNode
  borderRadius?: number
  style?: PressableProps['style']
} & Omit<PressableProps, 'style'>

const getResolvedStyle = (
  style: PressableProps['style'],
  state: PressableStateCallbackType,
) => (typeof style === 'function' ? style(state) : style)

const getBorderRadius = (style: StyleProp<ViewStyle>) => {
  const flattenedStyle = (StyleSheet.flatten(style) || {}) as ViewStyle
  return flattenedStyle.borderRadius ?? 0
}

export default function PressableWrapper({
  borderRadius,
  children,
  style,
  ...rest
}: propTyps) {
  return (
    <Pressable
      {...rest}
      accessibilityRole="button"
      style={state => {
        const resolvedStyle = getResolvedStyle(style, state)
        const resolvedBorderRadius =
          borderRadius ?? getBorderRadius(resolvedStyle as StyleProp<ViewStyle>)

        return [
          {
            borderRadius: resolvedBorderRadius,
            transform: [{scale: state.pressed ? 0.99 : 1}],
            opacity: state.pressed ? 0.9 : 1,
          },
          resolvedStyle,
        ]
      }}>
      {state => {
        const resolvedStyle = getResolvedStyle(style, state)
        const resolvedBorderRadius =
          borderRadius ?? getBorderRadius(resolvedStyle as StyleProp<ViewStyle>)

        return (
          <>
            <View
              pointerEvents="none"
              style={[
                styles.pressedOverlay,
                {
                  borderRadius: resolvedBorderRadius,
                  opacity: state.pressed ? 1 : 0,
                },
              ]}
            />
            {children}
          </>
        )
      }}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pressedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
})
