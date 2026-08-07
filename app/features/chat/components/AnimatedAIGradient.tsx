import {useChatRoomUIState} from '@app/features/chat/contexts/ChatRoomUIContext'
import COLORS from '@app/shared/constants/color'
import React, {useEffect} from 'react'
import {StyleSheet} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient)

export default function AnimatedAIGradient() {
  const {isAIGenerating} = useChatRoomUIState()

  const masterOpacity = useSharedValue(0)
  const time = useSharedValue(0)
  const entranceGlow = useSharedValue(0)

  useEffect(() => {
    if (isAIGenerating) {
      cancelAnimation(time)
      time.value = 0
      masterOpacity.value = withTiming(1, {
        duration: 700,
        easing: Easing.out(Easing.cubic),
      })
      entranceGlow.value = withSequence(
        withTiming(1, {duration: 650, easing: Easing.out(Easing.cubic)}),
        withTiming(0, {duration: 1400, easing: Easing.inOut(Easing.cubic)}),
      )
      time.value = withRepeat(
        withTiming(Math.PI * 2, {duration: 7500, easing: Easing.linear}),
        -1,
        false,
      )
    } else {
      cancelAnimation(time)
      cancelAnimation(entranceGlow)
      masterOpacity.value = withTiming(0, {
        duration: 900,
        easing: Easing.inOut(Easing.cubic),
      })
    }
  }, [entranceGlow, isAIGenerating, masterOpacity, time])

  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: masterOpacity.value,
    }
  })

  const warmBloomStyle = useAnimatedStyle(() => {
    const wave = time.value

    return {
      opacity: Math.min(
        1,
        0.5 + Math.sin(wave * 1.4) * 0.16 + entranceGlow.value * 0.28,
      ),
      transform: [
        {translateX: Math.sin(wave) * 90},
        {translateY: Math.cos(wave * 0.8) * 70},
        {rotate: `${Math.sin(wave * 0.65) * 10}deg`},
        {scale: 1.04 + Math.sin(wave * 1.2) * 0.06},
      ],
    }
  })

  const oliveBloomStyle = useAnimatedStyle(() => {
    const wave = time.value

    return {
      opacity: 0.38 + Math.cos(wave * 1.15) * 0.14,
      transform: [
        {translateX: Math.cos(wave * 0.85 + Math.PI) * 100},
        {translateY: Math.sin(wave * 1.05 + Math.PI) * 90},
        {rotate: `${Math.cos(wave * 0.7) * -9}deg`},
        {scale: 1.06 + Math.cos(wave) * 0.05},
      ],
    }
  })

  const sheenStyle = useAnimatedStyle(() => {
    const wave = time.value

    return {
      opacity: Math.min(
        0.9,
        0.24 + Math.sin(wave * 1.8) * 0.1 + entranceGlow.value * 0.42,
      ),
      transform: [
        {translateX: Math.sin(wave * 1.1 + Math.PI / 2) * 120},
        {translateY: Math.cos(wave * 0.9) * 65},
        {rotate: `${-18 + Math.sin(wave * 0.75) * 8}deg`},
        {scale: 1 + entranceGlow.value * 0.08},
      ],
    }
  })

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, containerStyle, styles.container]}
      pointerEvents="none">
      <LinearGradient
        colors={[COLORS.background, COLORS.accentLight + '4D', COLORS.background]}
        locations={[0, 0.42, 1]}
        start={{x: 0.15, y: 0}}
        end={{x: 0.85, y: 1}}
        style={StyleSheet.absoluteFill}
      />

      <AnimatedLinearGradient
        colors={[
          COLORS.primary + '00',
          COLORS.primary + '52',
          COLORS.accentLight + 'B3',
          COLORS.primary + '00',
        ]}
        locations={[0, 0.3, 0.62, 1]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={[styles.warmBloom, warmBloomStyle]}
      />

      <AnimatedLinearGradient
        colors={[
          COLORS.secondary + '00',
          COLORS.secondary + '4D',
          COLORS.accentLight + '66',
          COLORS.secondary + '00',
        ]}
        locations={[0, 0.35, 0.58, 1]}
        start={{x: 1, y: 0}}
        end={{x: 0, y: 1}}
        style={[styles.oliveBloom, oliveBloomStyle]}
      />

      <AnimatedLinearGradient
        colors={[
          COLORS.accentLight + '00',
          COLORS.accentLight + 'CC',
          COLORS.primary + '38',
          COLORS.accentLight + '00',
        ]}
        locations={[0, 0.4, 0.62, 1]}
        start={{x: 0, y: 0.5}}
        end={{x: 1, y: 0.5}}
        style={[styles.sheen, sheenStyle]}
      />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    zIndex: -1,
    overflow: 'hidden', // 벗어난 영역 숨김
  },
  warmBloom: {
    position: 'absolute',
    width: '175%',
    height: '105%',
    top: '-30%',
    left: '-42%',
    borderRadius: 999,
  },
  oliveBloom: {
    position: 'absolute',
    width: '165%',
    height: '105%',
    top: '12%',
    left: '-28%',
    borderRadius: 999,
  },
  sheen: {
    position: 'absolute',
    width: '170%',
    height: '48%',
    top: '18%',
    left: '-35%',
    borderRadius: 999,
  },
})
