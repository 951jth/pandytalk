import COLORS from '@app/shared/constants/color'
import React from 'react'
import {StyleSheet, View, ViewStyle} from 'react-native'

interface OnlineBadgeProps {
  isOnline: boolean
  size?: number
  style?: ViewStyle
}

/**
 * 유저의 온라인 상태를 나타내는 공통 뱃지 컴포넌트
 */
export default function OnlineBadge({
  isOnline,
  size = 14,
  style,
}: OnlineBadgeProps) {
  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isOnline ? COLORS.success : COLORS.gray,
        },
        style,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
})
