import React from 'react'
import {
  ActivityIndicator,
  GestureResponderEvent,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from 'react-native'
import COLORS from '../../constants/color'

type PandyButtonProps = {
  title: string
  onPress?: (event: GestureResponderEvent) => void
  disabled?: boolean
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'danger' | 'light'
  size?: 'small' | 'middle' | 'large'
  shape?: 'default' | 'rounded' | 'circle'
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}

export default function PandyButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'middle',
  shape = 'default',
  style,
  textStyle,
}: PandyButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        shapeStyles[shape],
        disabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={[styles.text, textStyles[variant], textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    fontFamily: 'BMDOHYEON',
  },
  disabled: {
    opacity: 0.6,
  },
})

const sizeStyles = StyleSheet.create({
  small: {paddingVertical: 6, paddingHorizontal: 12},
  middle: {paddingVertical: 10, paddingHorizontal: 16},
  large: {paddingVertical: 14, paddingHorizontal: 20},
})

const variantStyles = StyleSheet.create({
  primary: {backgroundColor: COLORS.primary},
  secondary: {backgroundColor: COLORS.secondary},
  danger: {backgroundColor: COLORS.error},
  light: {backgroundColor: '#F2F2F7'},
})

const textStyles = StyleSheet.create({
  primary: {color: '#fff'},
  secondary: {color: '#111'},
  danger: {color: '#fff'},
  light: {color: '#111'},
})

const shapeStyles = StyleSheet.create({
  default: {borderRadius: 8},
  rounded: {borderRadius: 50},
  circle: {
    borderRadius: 1000, // 충분히 크게 주면 정사각형일 때 원 모양 됨
    aspectRatio: 1, // 가로/세로 같게 유지해야 원형 가능
    paddingVertical: 0,
    paddingHorizontal: 0,
    minWidth: 44, // 터치 영역 최소 확보
    minHeight: 44,
  },
})
