import React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import COLORS from '../../../constants/color'

type propTypes = {
  count: number
  textColor?: string
  bgColor?: string
  size?: number
}

export default function PandyBadge({
  count = 0,
  textColor = COLORS.onPrimary,
  bgColor = COLORS.primary,
}: propTypes) {
  return count ? (
    <View style={[styles.badge, {backgroundColor: bgColor}]}>
      <Text style={[styles.count, {color: textColor}]}>
        {String(count || 0)}
      </Text>
    </View>
  ) : (
    <></>
  )
}

const styles = StyleSheet.create({
  badge: {
    width: 18,
    height: 18,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    color: COLORS.onPrimary,
    fontWeight: 600,
    fontSize: 12,
  },
})
