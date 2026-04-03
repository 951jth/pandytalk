import COLORS from '@app/shared/constants/color'
import React, {useState} from 'react'
import {
  StyleSheet,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import {Button} from 'react-native-paper'

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

  const  labelStyleMap = {
    small: styles.smallSizeText,
    middle: styles.middleSizeText,
    large: styles.largeSizeText,
  }

  const containerColorMap = {
    primary: styles.primaryContainer,
    danger: styles.dangerContainer,
    secondary: styles.secondaryContainer,
    gray: styles.grayContainer,
    disabled: styles.disabledContainer,
  }

  const labelColorMap = {
    primary:
      rest.mode === 'text' || rest.mode === 'outlined'
        ? styles.primaryLabelText
        : styles.primaryLabelOnColor,
    danger:
      rest.mode === 'text' || rest.mode === 'outlined'
        ? styles.dangerLabelText
        : styles.primaryLabelOnColor,
    secondary:
      rest.mode === 'text' || rest.mode === 'outlined'
        ? styles.secondaryLabelText
        : styles.primaryLabelOnColor,
    gray: styles.grayLabelText,
    disabled: styles.disabledLabel,
  }

  // disabled 기본 정책: 명시적 disabled 우선 > (loading || (edit && hasErrors))
  const computedDisabled = typeof disabled === 'boolean' ? disabled : !!loading
  const activeColorType = computedDisabled ? 'disabled' : colorType

  return (
    <Button
      {...rest}
      onPress={onPress}
      style={[
        sizeStyleMap?.[size],
        shapeStyleMap?.[shape],
        containerColorMap?.[activeColorType],
        {minWidth: 0, flex: fullWidth ? 1 : 0},
        style as any,
      ]}
      labelStyle={[
        labelStyleMap?.[size],
        labelColorMap?.[activeColorType],
        rest.labelStyle,
      ]} // ✅ 내부 사이즈/컬러 스타일과 외부 커스텀 스타일 병합
      contentStyle={[styles.contentBase, rest.contentStyle]}
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
  // CONTENT STYLE
  contentBase: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  //SIZE STYLE
  smallSizeButton: {paddingHorizontal: 4},
  smallSizeText: {fontSize: 12, fontFamily: 'BMDOHYEON'},
  middleSizeText: {fontSize: 16, fontFamily: 'BMDOHYEON'},
  largeSizeText: {fontSize: 18, fontFamily: 'BMDOHYEON'},
  //SHAPE STYLE
  rounded: {borderRadius: 12},
  circle: {borderRadius: 100},
  rectangle: {borderRadius: 0},
  normal: {borderRadius: 20},
  // COLOR - CONTAINER STYLE
  primaryContainer: {backgroundColor: COLORS.primary},
  dangerContainer: {backgroundColor: COLORS.error},
  secondaryContainer: {backgroundColor: COLORS.secondary},
  grayContainer: {backgroundColor: COLORS.gray},
  disabledContainer: {backgroundColor: COLORS.gray},
  // COLOR - LABEL STYLE
  primaryLabelOnColor: {color: COLORS.onPrimary}, // 박스형일 때 (흰색)
  primaryLabelText: {color: COLORS.primary}, // 텍스트형일 때 (테라코타)
  dangerLabelText: {color: COLORS.error},
  secondaryLabelText: {color: COLORS.secondary},
  grayLabelText: {color: COLORS.text},
  disabledLabel: {color: COLORS.text},
})
