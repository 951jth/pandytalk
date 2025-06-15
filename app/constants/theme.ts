import {DefaultTheme, MD3LightTheme} from 'react-native-paper'
import COLORS from './color'

const fonts = {
  ...DefaultTheme.fonts,
  // MD3 typography 기준 설정
  displayLarge: {
    fontFamily: 'BMDOHYEON',
    fontWeight: 'normal',
  },
  displayMedium: {
    fontFamily: 'BMDOHYEON',
    fontWeight: 'normal',
  },
  displaySmall: {
    fontFamily: 'BMDOHYEON',
    fontWeight: 'normal',
  },
  headlineLarge: {
    fontFamily: 'BMDOHYEON',
    fontWeight: 'normal',
  },
  headlineMedium: {
    fontFamily: 'BMDOHYEON',
    fontWeight: 'normal',
  },
  headlineSmall: {
    fontFamily: 'BMDOHYEON',
    fontWeight: 'normal',
  },
  titleLarge: {
    fontFamily: 'BMDOHYEON',
    // fontFamily: 'System', // label (라벨)
    fontWeight: 'normal',
  },
  titleMedium: {
    fontFamily: 'BMDOHYEON',
    fontWeight: 'normal',
  },
  titleSmall: {
    fontFamily: 'BMDOHYEON',
    fontWeight: 'normal',
  },
  bodyLarge: {
    // fontFamily: 'BMDOHYEON',
    fontFamily: 'System', // 입력 텍스트
    // fontWeight: 'normal',
  },
  bodyMedium: {
    // fontFamily: 'BMDOHYEON',
    fontFamily: 'System', // placeholder
    fontWeight: 'normal',
  },
  bodySmall: {
    fontFamily: 'BMDOHYEON',
    fontWeight: 'normal',
  },
  labelLarge: {
    fontFamily: 'BMDOHYEON',
    fontWeight: 'normal',
  },
  labelMedium: {
    fontFamily: 'BMDOHYEON',
    fontWeight: 'normal',
  },
  labelSmall: {
    fontFamily: 'BMDOHYEON',
    fontWeight: 'normal',
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
