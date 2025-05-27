import {MD3LightTheme} from 'react-native-paper'
import COLORS from './color'

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    background: COLORS.background,
    surface: '#FFFFFF', // surface 배경
    surfaceVariant: '#F5F5F5', // 선택 사항
    error: COLORS.error,
    onPrimary: COLORS.text,
    onBackground: '#000000',
    onSurface: '#000000',
    outline: COLORS.gray,
    fontWeight: '400',
    lineHeight: 22,
    fontSize: 16,
  },
}

export default theme
