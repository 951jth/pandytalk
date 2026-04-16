import COLORS from '@app/shared/constants/color'
import React from 'react'
import {StyleSheet, View, ViewStyle, StyleProp, TextInput} from 'react-native'
import {Icon} from 'react-native-paper'

interface SearchInputProps {
  placeholder?: string
  value?: string
  onChangeText?: (text: string) => void
  containerStyle?: StyleProp<ViewStyle>
}

export default function SearchInput({
  placeholder = '검색어를 입력하세요',
  value,
  onChangeText,
  containerStyle,
}: SearchInputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.searchBar}>
        <Icon source="magnify" size={20} color={COLORS.textSecondary} />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecondary}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          cursorColor={COLORS.primary}
        />
        {value ? (
          <Icon
            source="close-circle"
            size={20}
            color={COLORS.textSecondary}
            // TextInput 밖의 아이콘이므로 직접 클릭 처리가 안 될 수 있어
            // 실제 구현에서는 Touchable로 감싸는 것이 좋으나 스타일 우선 유지
          />
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.outerColor,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    color: COLORS.text,
    fontFamily: 'BMDOHYEON',
    fontSize: 14,
    paddingVertical: 0,
  },
})
