import React from 'react'
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  type StyleProp,
  type TextStyle,
} from 'react-native'

type RNTouchableOpacityProps = React.ComponentProps<typeof TouchableOpacity>
type ColorButtonProps = RNTouchableOpacityProps & {
  label: string
  bgColor?: string
  textColor?: string
  padding?: number
  textStyle?: StyleProp<TextStyle>
}

export default function ColorButton({
  label,
  bgColor = '#4CAF50',
  textColor = '#FFF',
  padding = 8,
  style,
  textStyle,
  ...props
}: ColorButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.buttonWrap, {backgroundColor: bgColor, padding}, style]}
      {...props}>
      <Text style={[styles.buttonText, {color: textColor}, textStyle]}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  buttonWrap: {
    padding: 16,
    borderRadius: 8,
  },
  buttonText: {
    fontFamily: 'BMDOHYEON',
    fontSize: 10,
    textAlign: 'center',
  },
})
