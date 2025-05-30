import React from 'react'
import {StyleProp, StyleSheet, View, ViewProps} from 'react-native'
import {Icon} from 'react-native-paper'
import COLORS from '../../constants/color'

interface Profile {
  boxSize?: number
  iconSize?: number
  boxStyle?: StyleProp<ViewProps>
}

export default function DefaultProfile({
  boxSize = 150,
  iconSize = 120,
  boxStyle = {},
}): React.JSX.Element {
  return (
    <View
      style={[
        styles.frame,
        {width: boxSize, height: boxSize, borderRadius: boxSize},
        boxStyle,
      ]}>
      <Icon source="account" size={iconSize} color={COLORS.primary} />
    </View>
  )
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: COLORS.primary,
    borderWidth: 1,
    position: 'relative',
  },
})
