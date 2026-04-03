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
  pending: {text: '승인대기', textColor: '#E67E22', bgColor: '#FEF5ED'},
  confirm: {text: '승인완료', textColor: '#27AE60', bgColor: '#EAF7EE'},
  reject: {text: '거절됨', textColor: '#E74C3C', bgColor: '#FDEDEC'},
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
    borderRadius: 12, // 더 부드러운 곡률
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'flex-start', // 내용만큼만 너비 차지
  },
  colorChipText: {
    fontFamily: 'BMDOHYEON',
    fontSize: 10,
    letterSpacing: -0.5,
  },
})
