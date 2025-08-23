import React, {useState} from 'react'
import {Button} from 'react-native-paper'

type PaperButtonProps = React.ComponentProps<typeof Button>

type CustomButtonProps = PaperButtonProps & {
  /** 프레스 시 임시 리플 색 자동 적용(기본 on) */
  autoRippleOnPress?: boolean
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

  // 나머지 Paper Button props 그대로 전달
  ...rest
}) => {
  const [pressed, setPressed] = useState(false)

  // disabled 기본 정책: 명시적 disabled 우선 > (loading || (edit && hasErrors))
  const computedDisabled = typeof disabled === 'boolean' ? disabled : !!loading

  return (
    <Button
      {...rest}
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
