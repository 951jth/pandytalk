import COLORS from '@app/shared/constants/color'
import React from 'react'
import {StyleProp, StyleSheet, Text, View, ViewStyle} from 'react-native'
import {Icon} from 'react-native-paper'

type CustomChipType = {
  title: string
  textColor?: string
  bgColor?: string
  iconName?: string
  iconColor?: string
  style?: StyleProp<ViewStyle>
}

const CustomChip = ({
  title,
  textColor = COLORS.onPrimary,
  bgColor = COLORS.primary,
  iconName,
  iconColor,
  style,
}: CustomChipType) => {
  return (
    <View style={[styles.colorChip, {backgroundColor: bgColor}, style]}>
      {iconName && (
        <Icon
          source={iconName}
          size={16}
          color={iconColor || textColor}
        />
      )}
      <Text style={[styles.colorChipText, {color: textColor}]}>
        {title || '-'}
      </Text>
    </View>
  )
}

export default CustomChip

const styles = StyleSheet.create({
  colorChip: {
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  colorChipText: {
    fontFamily: 'BMDOHYEON',
    fontSize: 12,
  },
})
