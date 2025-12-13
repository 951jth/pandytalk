import React from 'react'
import {StyleSheet, Text, View} from 'react-native'

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

const ColorChip = ({status}: {status: 'pending' | 'confirm' | 'reject'}) => {
  const statusObj = accountStatusMap?.[status] || {}
  return (
    <View style={[styles.colorChip, {backgroundColor: statusObj.bgColor}]}>
      <Text style={[styles.colorChipText, {color: statusObj.textColor}]}>
        {statusObj?.text || '-'}
      </Text>
    </View>
  )
}

export default ColorChip

const styles = StyleSheet.create({
  colorChip: {
    borderRadius: 8,
    fontSize: 10,
    position: 'absolute',
    top: 0,
    right: 0,
    // paddingHorizontal: 16,
    padding: 8,
  },
  colorChipText: {
    fontFamily: 'BMDOHYEON',
    fontSize: 11,
  },
})
