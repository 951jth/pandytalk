import React, {useCallback, useMemo, useState} from 'react'
import {Platform, StyleSheet, Text, TextStyle} from 'react-native'
import {TextInput, TextInputProps} from 'react-native-paper'
import COLORS from '../../constants/color'

interface Props extends TextInputProps {
  edit?: boolean // 읽기 모드 전환
  hasError?: boolean // 에러 보더/라벨 스타일만 적용
  minRows?: number // 기본 2줄
  maxRows?: number // 기본 6줄
  lineHeight?: number // 기본 22
}

export default function EditTextInput({
  edit = true,
  hasError = false,
  minRows = 2,
  maxRows = 6,
  lineHeight = 22,
  style,
  contentStyle,
  value,
  onChangeText,
  ...others
}: Props) {
  // iOS는 numberOfLines가 높이를 안 정해주므로 직접 높이 계산
  const minH = useMemo(
    () => Math.max(1, minRows) * lineHeight,
    [minRows, lineHeight],
  )
  const maxH = useMemo(
    () => Math.max(minH, maxRows * lineHeight),
    [maxRows, minH, lineHeight],
  )

  const [height, setHeight] = useState(minH)
  const [focused, setFocused] = useState(false)

  const handleContentSizeChange = useCallback(
    (e: any) => {
      const h = e?.nativeEvent?.contentSize?.height ?? minH
      const clamped = Math.max(minH, Math.min(h, maxH))
      setHeight(clamped)
    },
    [minH, maxH],
  )

  if (!edit) {
    return (
      <Text style={styles.fixedText}>
        {typeof value === 'string' && value.trim().length > 0
          ? value
          : (others?.defaultValue as string) || '-'}
      </Text>
    )
  }

  return (
    <TextInput
      {...others}
      value={value as string}
      onChangeText={onChangeText}
      multiline
      onContentSizeChange={handleContentSizeChange}
      numberOfLines={
        Platform.OS === 'android' ? Math.round(minRows) : undefined
      }
      scrollEnabled={height >= maxH}
      mode="flat"
      underlineColor="transparent"
      activeUnderlineColor="transparent"
      error={hasError}
      style={[
        styles.input,
        focused && styles.focusedInput,
        // 에러일 때 색만 Paper가 처리하므로 보더는 그대로 유지
        style as TextStyle,
      ]}
      contentStyle={[
        {height, lineHeight, textAlignVertical: 'top'},
        contentStyle as TextStyle,
      ]}
      onFocus={e => {
        setFocused(true)
        others?.onFocus?.(e)
      }}
      onBlur={e => {
        setFocused(false)
        others?.onBlur?.(e)
      }}
      // UX: 메모/설명 필드는 자동수정/대문자 off 권장
      autoCapitalize={others.autoCapitalize ?? 'none'}
      autoCorrect={others.autoCorrect ?? false}
      blurOnSubmit={false} // 엔터=줄바꿈
    />
  )
}

const styles = StyleSheet.create({
  // EditInput의 스타일을 준수
  input: {
    width: '100%',
    backgroundColor: 'transparent',
    borderBottomWidth: 0, // 기본은 0
    paddingHorizontal: 0,
    fontSize: 16,
    fontFamily: 'Roboto',
  },
  focusedInput: {
    borderBottomWidth: 3, // 포커스 시 하단 보더
    borderColor: COLORS.primary,
    marginBottom: 4,
    paddingBottom: 0,
  },
  fixedText: {
    fontFamily: 'BMDOHYEON',
    color: '#5D5D5D',
    fontSize: 12,
  },
})
