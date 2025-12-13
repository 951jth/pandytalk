import React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import COLORS from '../../../constants/color'

// ✅ 승인됨
// 배경색: #E8F5E9 (연한 그린톤)
// 글자색: #2E7D32 (짙은 그린)

// 🕒 대기중
// 배경색: #FFF3E0 (연한 오렌지톤)
// 글자색: #EF6C00 (짙은 오렌지)

// ❌ 거절됨
// 배경색: #FFEBEE (연한 레드톤)
// 글자색: #C62828 (짙은 레드)

const accountStatusMap = {
  pending: {text: '대기중', textColor: '#FF9800', bgColor: '#FFF3E0'},
  confirm: {text: '승인됨', textColor: '#4CAF50', bgColor: '#E8F5E9'},
  reject: {text: '거절됨', textColor: '#F44336', bgColor: '#FFEBEE'},
}

type CustomChipType = {
  title: string
  textColor?: string
  bgColor?: string
}

const CustomChip = ({
  title,
  textColor = COLORS.onPrimary,
  bgColor = COLORS.primary,
}: CustomChipType) => {
  //   const statusObj = accountStatusMap?.[status] || {}
  return (
    <View style={[styles.colorChip, {backgroundColor: bgColor}]}>
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
    fontSize: 10,
    position: 'absolute',
    top: 8,
    right: 8,
    // paddingHorizontal: 16,
    padding: 8,
  },
  colorChipText: {
    fontFamily: 'BMDOHYEON',
    fontSize: 10,
  },
})
