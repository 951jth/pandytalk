import React, {useState} from 'react'
import {
  StyleSheet,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import {Button} from 'react-native-paper'
import COLORS from '../../constants/color'

type PaperButtonProps = React.ComponentProps<typeof Button>

type CustomButtonProps = PaperButtonProps & {
  /** 프레스 시 임시 리플 색 자동 적용(기본 on) */
  autoRippleOnPress?: boolean
  size?: 'small' | 'middle' | 'large'
  shape?: 'rectangle' | 'rounded' | 'circle' | 'normal'
  style?: StyleProp<ViewStyle | TextStyle>
  colorType?: 'primary' | 'danger' | 'secondary' | 'gray' | 'disabled'
  fullWidth?: boolean
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  // Button 기본 props
  children,
  disabled,
  loading,
  rippleColor,
  onPress,
  onPressIn,
  onPressOut,
  onLongPress,
  accessibilityLabel,
  // 커스텀 제어 props
  autoRippleOnPress = true,
  size = 'middle',
  shape = 'normal',
  colorType = 'primary',
  style,
  fullWidth,
  // 나머지 Paper Button props 그대로 전달
  ...rest
}) => {
  const [pressed, setPressed] = useState(false)

  const sizeStyleMap: Record<string, any> = {
    small: styles.smallSizeButton,
    middle: null,
  }
  const shapeStyleMap: Record<string, any> = {
    rectangle: styles?.rectangle,
    rounded: styles.rounded,
    circle: styles.circle,
    normal: styles.normal,
  }

  const labelStyleMap = {
    small: styles.smallSizeText,
    middle: styles.middleSizeText,
    large: styles.largeSizeText,
  }

  const colorStyleMap = {
    primary: styles.primary,
    danger: styles.danger,
    secondary: styles.secondary,
    gray: styles.gray,
    disabled: styles.disabled,
  }

  // disabled 기본 정책: 명시적 disabled 우선 > (loading || (edit && hasErrors))
  const computedDisabled = typeof disabled === 'boolean' ? disabled : !!loading

  return (
    <Button
      {...rest}
      onPress={onPress}
      style={[
        sizeStyleMap?.[size],
        shapeStyleMap?.[shape],
        colorStyleMap?.[disabled ? 'disabled' : colorType],
        {minWidth: 0, flex: fullWidth ? 1 : 0},
        style,
      ]}
      labelStyle={labelStyleMap?.[size]}
      contentStyle={{paddingHorizontal: 4}} // 기본보다 축소
      mode={rest.mode ?? 'contained'}
      disabled={computedDisabled}
      loading={loading}
      onPressIn={e => {
        setPressed(true)
        onPressIn?.(e)
      }}
      onPressOut={e => {
        setPressed(false)
        onPressOut?.(e)
      }}
      onLongPress={onLongPress}
      rippleColor={
        autoRippleOnPress && pressed && !rippleColor
          ? 'rgba(255,255,255,0.2)'
          : rippleColor
      }
      accessibilityRole={rest.accessibilityRole ?? 'button'}>
      {children}
    </Button>
  )
}

const styles = StyleSheet.create({
  //SIZE STYLE
  smallSizeButton: {paddingHorizontal: 4},
  smallSizeText: {fontSize: 11, paddingHorizontal: 0},
  middleSizeText: {fontSize: 14},
  largeSizeText: {fontSize: 16},
  //SHAPE STYLE
  rounded: {borderRadius: 8},
  circle: {borderRadius: '100px'},
  rectangle: {borderRadius: 0},
  normal: {borderRadius: 4},
  //COLOR STYLE
  primary: {color: COLORS.onPrimary, backgroundColor: COLORS.primary},
  danger: {color: COLORS.onPrimary, backgroundColor: COLORS?.error},
  secondary: {color: COLORS.onPrimary, backgroundColor: COLORS.secondary},
  gray: {color: COLORS.onPrimary, backgroundColor: COLORS.gray},
  disabled: {color: COLORS.text, backgroundColor: COLORS.gray},
})
