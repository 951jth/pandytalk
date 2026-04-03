import React from 'react'
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native'

import COLORS from '@shared/constants/color'

export type SuggestionItem = {
  label: string
  value: string
  fixed?: boolean
}

type Props = {
  isVisible: boolean
  suggestions: SuggestionItem[]
  onPress: (value: string) => void
}

export default function MentionSuggestion({
  isVisible,
  suggestions,
  onPress,
}: Props) {
  if (!isVisible || suggestions.length === 0) return null

  return (
    <View style={styles.container}>
      <View style={styles.dropdown}>
        {suggestions.map((item, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.7}
            onPress={() => onPress(item.value)}
            style={[
              styles.itemRow,
              index !== suggestions.length - 1 && styles.borderBottom, // 마지막 아이템 제외 구분선
            ]}>
            <Image
              source={require('@shared/assets/icons/pandy_icon.png')}
              style={styles.icon}
            />
            <Text style={styles.itemText} numberOfLines={1}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: '100%',
    left: 12, // 입력창 왼쪽에서 살짝 띄움
    zIndex: 100,
    marginBottom: 12, // 입력창과의 간격
  },
  dropdown: {
    minWidth: 220, // 최소 너비
    maxWidth: 280, // 최대 너비 (너무 길어지지 않게)
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    // 팝업 효과를 위한 그림자 설정
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    overflow: 'hidden', // 라운딩 경계면 정리를 위해 추가
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 4,
  },
  borderBottom: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  icon: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  itemText: {
    color: COLORS.primary,
    fontFamily: 'BMDOHYEON',
    fontSize: 14,
    flex: 1,
  },
})
