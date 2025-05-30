import React from 'react'
import {StyleSheet, View} from 'react-native'
import COLORS from '../../constants/color'

export default function Profile(): React.JSX.Element {
  return <View></View>
}

const styles = StyleSheet.create({
  profile: {},
  frame: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: COLORS.primary,
    borderWidth: 1,
    position: 'relative',
  },
})
