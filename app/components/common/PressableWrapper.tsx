import type {ReactNode} from 'react'
import React from 'react'
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

type propTyps = {
  children: ReactNode
  style?: StyleProp<ViewStyle>
} & PressableProps

export default function PressableWrapper({children, style, ...rest}: propTyps) {
  return (
    <Pressable
      {...rest}
      style={({pressed}) => [
        {
          marginBottom: 8,
          borderRadius: 8,
          shadowColor: '#000',
          shadowOffset: {width: 0, height: pressed ? 0.5 : 1.5},
          shadowOpacity: 0.1,
          shadowRadius: pressed ? 1 : 3,
          elevation: pressed ? 1 : 3,
          backgroundColor: '#FFF',
          transform: [{scale: pressed ? 0.98 : 1}],
        },
        style,
      ]}>
      {children}
    </Pressable>
  )
}
