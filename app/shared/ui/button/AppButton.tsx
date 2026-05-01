import COLORS from '@app/shared/constants/color'
import React, {useEffect, useRef, useState} from 'react'
import {
  Animated,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import {Button} from 'react-native-paper'

type PaperButtonProps = React.ComponentProps<typeof Button>

type AppButtonProps = PaperButtonProps & {
  /** 프레스 시 임시 리플 색 자동 적용(기본 on) */
  autoRippleOnPress?: boolean
  size?: 'small' | 'middle' | 'large'
  shape?: 'rectangle' | 'rounded' | 'circle' | 'normal'
  style?: StyleProp<ViewStyle | TextStyle>
  colorType?: 'primary' | 'danger' | 'secondary' | 'gray' | 'disabled'
  fullWidth?: boolean
  loadingIndicator?: 'dots' | 'spinner'
  loadingDotCount?: 3 | 4
  loadingText?: string
}

/**
 * [타입 추출 원리]
 * 1. AppButtonProps['size']: 인덱스 액세스 타입으로 Props 인터페이스에서 특정 속성의 타입만 추출합니다.
 * 2. NonNullable<T>: 속성 정의 시 사용된 '?'(옵셔널)로 인해 포함된 'undefined'를 제거합니다.
 * 
 * [이점]
 * - '단일 진실 공급원': Props 정의만 수정하면 내부 맵(Record) 타입들이 자동으로 동기화됩니다.
 * - '엄격한 매핑': 아래의 sizeStyleMap 등에서 모든 케이스를 누락 없이 처리하도록 강제(Exhaustive Check)합니다.
 */
type ButtonSize = NonNullable<AppButtonProps['size']>
type ButtonShape = NonNullable<AppButtonProps['shape']>
type ButtonColorType = NonNullable<AppButtonProps['colorType']>

export const AppButton: React.FC<AppButtonProps> = ({
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
  loadingIndicator = 'dots',
  loadingDotCount = 3,
  loadingText,
  // 나머지 Paper Button props 그대로 전달
  ...rest
}) => {
  const [pressed, setPressed] = useState(false)

  // disabled는 인터랙션 차단, loading은 테마 색상 유지 상태로 분리
  const computedDisabled = !!disabled || !!loading
  const activeColorType = disabled && !loading ? 'disabled' : colorType
  const isTextLikeMode = rest.mode === 'text' || rest.mode === 'outlined'
  const shouldShowDots = !!loading && loadingIndicator === 'dots'
  const loadingDotColor = getButtonContentColor(activeColorType, isTextLikeMode)
  const loadingLabel = loadingText ?? children
  const labelColorStyle = getLabelColorStyle(activeColorType, isTextLikeMode)
  const labelStyle = [
    labelStyleMap[size],
    labelColorStyle,
    rest.labelStyle,
  ] as StyleProp<TextStyle>

  return (
    <Button
      {...rest}
      onPress={onPress}
      style={[
        sizeStyleMap[size],
        shapeStyleMap[shape],
        containerColorMap[activeColorType],
        {minWidth: 0, flex: fullWidth ? 1 : 0},
        style as StyleProp<ViewStyle>,
      ]}
      labelStyle={labelStyle} // ✅ 내부 사이즈/컬러 스타일과 외부 커스텀 스타일 병합
      contentStyle={[styles.contentBase, rest.contentStyle]}
      mode={rest.mode ?? 'contained'}
      disabled={computedDisabled}
      loading={loadingIndicator === 'spinner' ? loading : false}
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
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={rest.accessibilityRole ?? 'button'}>
      {shouldShowDots ? (
        <View style={styles.loadingContent}>
          {loadingLabel && (
            <Text style={labelStyle}>{loadingLabel}</Text>
          )}
          <LoadingDots color={loadingDotColor} count={loadingDotCount} />
        </View>
      ) : (
        children
      )}
    </Button>
  )
}

function LoadingDots({color, count}: {color: string; count: 3 | 4}) {
  const dots = useRef(
    Array.from({length: count}, () => new Animated.Value(0)),
  ).current

  useEffect(() => {
    const animations = dots.map((dot, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 120),
          Animated.timing(dot, {
            toValue: 1,
            duration: 260,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 260,
            useNativeDriver: true,
          }),
          Animated.delay((dots.length - index) * 120),
        ]),
      ),
    )

    Animated.parallel(animations).start()

    return () => {
      animations.forEach(animation => animation.stop())
    }
  }, [dots])

  return (
    <View style={styles.loadingDots} accessibilityLabel="로딩 중">
      {dots.map((dot, index) => {
        const scale = dot.interpolate({
          inputRange: [0, 1],
          outputRange: [0.72, 1.18],
        })
        const opacity = dot.interpolate({
          inputRange: [0, 1],
          outputRange: [0.45, 1],
        })

        return (
          <Animated.View
            key={index}
            style={[
              styles.loadingDot,
              {
                backgroundColor: color,
                opacity,
                transform: [{scale}],
              },
            ]}
          />
        )
      })}
    </View>
  )
}

function getLabelColorStyle(
  colorType: ButtonColorType,
  isTextLikeMode: boolean,
) {
  if (isTextLikeMode) {
    if (colorType === 'primary') return styles.primaryLabelText
    if (colorType === 'danger') return styles.dangerLabelText
    if (colorType === 'secondary') return styles.secondaryLabelText
  }

  if (colorType === 'gray') return styles.grayLabelText
  if (colorType === 'disabled') return styles.disabledLabel

  return styles.primaryLabelOnColor
}

function getButtonContentColor(
  colorType: ButtonColorType,
  isTextLikeMode: boolean,
) {
  if (isTextLikeMode) {
    if (colorType === 'primary') return COLORS.primary
    if (colorType === 'danger') return COLORS.error
    if (colorType === 'secondary') return COLORS.secondary
  }

  if (colorType === 'gray' || colorType === 'disabled') return COLORS.text

  return COLORS.onPrimary
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
  loadingDots: {
    height: 22,
    minWidth: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  loadingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
})

const sizeStyleMap: Record<ButtonSize, StyleProp<ViewStyle> | null> = {
  small: styles.smallSizeButton,
  middle: null,
  large: null,
}

const shapeStyleMap: Record<ButtonShape, StyleProp<ViewStyle>> = {
  rectangle: styles.rectangle,
  rounded: styles.rounded,
  circle: styles.circle,
  normal: styles.normal,
}

const labelStyleMap: Record<ButtonSize, StyleProp<TextStyle>> = {
  small: styles.smallSizeText,
  middle: styles.middleSizeText,
  large: styles.largeSizeText,
}

const containerColorMap: Record<ButtonColorType, StyleProp<ViewStyle>> = {
  primary: styles.primaryContainer,
  danger: styles.dangerContainer,
  secondary: styles.secondaryContainer,
  gray: styles.grayContainer,
  disabled: styles.disabledContainer,
}
