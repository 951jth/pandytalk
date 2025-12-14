import {DefaultTheme, MD3LightTheme} from 'react-native-paper'
import COLORS from './color'

const fonts = {
  ...DefaultTheme.fonts,
  // MD3 typography 기준 설정
  displayLarge: {
    fontFamily: 'BMDOHYEON',
  },
  displayMedium: {
    fontFamily: 'BMDOHYEON',
  },
  displaySmall: {
    fontFamily: 'BMDOHYEON',
  },
  headlineLarge: {
    fontFamily: 'BMDOHYEON',
  },
  headlineMedium: {
    fontFamily: 'BMDOHYEON',
  },
  headlineSmall: {
    fontFamily: 'BMDOHYEON',
  },
  titleLarge: {
    fontFamily: 'BMDOHYEON',
    // fontFamily: 'System', // label (라벨)
  },
  titleMedium: {
    fontFamily: 'BMDOHYEON',
  },
  titleSmall: {
    fontFamily: 'BMDOHYEON',
  },
  bodyLarge: {
    // fontFamily: 'BMDOHYEON',
    fontFamily: 'System', // 입력 텍스트
    // fontWeight: 'normal',
  },
  bodyMedium: {
    // fontFamily: 'BMDOHYEON',
    fontFamily: 'System', // placeholder
  },
  bodySmall: {
    fontFamily: 'BMDOHYEON',
  },
  labelLarge: {
    fontFamily: 'BMDOHYEON',
  },
  labelMedium: {
    fontFamily: 'BMDOHYEON',
  },
  labelSmall: {
    fontFamily: 'BMDOHYEON',
  },
}

const fontConfig = {
  default: {
    fontFamily: 'BMDOHYEON',
    fontWeight: 'normal' as const,
    letterSpacing: 0.5,
    fontSize: 14,
    lineHeight: 20,
  },
}

const theme = {
  ...MD3LightTheme,
  // fonts: configureFonts({config: fontConfig}),
  fonts,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    background: COLORS.background,
    surface: '#FFFFFF', // surface 배경
    surfaceVariant: '#F5F5F5', // 선택 사항
    error: COLORS.error,
    onPrimary: COLORS.onPrimary,
    onBackground: '#000000',
    onSurface: '#000000',
    outline: COLORS.gray,
    // fontWeight: '400',
    // lineHeight: 22,
    // fontSize: 12,
  },
}

export default theme
