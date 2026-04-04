import React, {useEffect, useRef} from 'react'
import {Animated, DimensionValue, StyleSheet, ViewStyle} from 'react-native'

interface SkeletonProps {
  width?: DimensionValue
  height?: DimensionValue
  borderRadius?: number
  style?: ViewStyle
}

/**
 * 범용 애니메이션 스켈레톤 베이스 컴포넌트
 */
export default function Skeleton({
  width,
  height,
  borderRadius = 4,
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start()
  }, [opacity])

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height: height as any,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E1E9EE', // 연한 회색 베이스
  },
})
