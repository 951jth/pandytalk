// components/inputs/EditTextArea.tsx  (RN 코어 TextInput 버전)
import COLORS from '@app/shared/constants/color'
import React, {useCallback, useMemo, useState} from 'react'
import {
  Platform,
  Text as RNText,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native'

type Props = Omit<
  RNTextInputProps,
  'style' | 'value' | 'onChangeText' | 'multiline' | 'numberOfLines'
> & {
  edit?: boolean // 읽기 모드 전환
  hasError?: boolean // 에러 보더/라벨 스타일만 적용
  minRows?: number // 기본 2줄
  maxRows?: number // 기본 6줄
  lineHeight?: number // 기본 22
  style?: ViewStyle // ⬅️ 래퍼(View) 스타일 (보더/레이아웃)
  contentStyle?: TextStyle // ⬅️ 입력 텍스트 스타일
  value?: string | number | null | undefined
  onChangeText?: (text: string) => void
  placeholderTextColor?: string
}

export default function EditTextArea({
  edit = true,
  hasError = false,
  minRows = 2,
  maxRows = 6,
  lineHeight = 22,
  style,
  contentStyle,
  value,
  onChangeText,
  placeholderTextColor = '#000000',
  onFocus,
  onBlur,
  ...rest
}: Props) {
  // 높이 범위 계산 (iOS는 numberOfLines가 높이를 고정 안 해줘서 직접 계산)
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

  // 값은 항상 문자열로
  const v =
    typeof value === 'string' ? value : value == null ? '' : String(value)

  // 읽기 모드
  if (!edit) {
    return (
      <RNText style={styles.fixedText}>
        {v.trim().length > 0 ? v : ((rest as any)?.defaultValue ?? '-')}
      </RNText>
    )
  }

  // RN 코어 TextInput에 불필요하거나 Paper 전용 prop이 섞여도 전달되지 않게 정리
  const {
    // @ts-ignore (혹시 부모가 실수로 넘겨도 필터링)
    mode,
    theme,
    underlineStyle,
    activeUnderlineColor,
    underlineColor,
    right,
    left,
    ...inputProps
  } = rest as any

  return (
    <View
      style={[
        styles.container,
        focused && styles.containerFocused,
        hasError && styles.containerError,
        style,
      ]}>
      <RNTextInput
        {...inputProps}
        value={v}
        onChangeText={onChangeText}
        multiline
        onContentSizeChange={handleContentSizeChange}
        numberOfLines={
          Platform.OS === 'android' ? Math.round(minRows) : undefined
        }
        scrollEnabled={height >= maxH}
        // 입력 스타일
        style={[
          styles.input,
          {height, lineHeight, textAlignVertical: 'top' as const},
          contentStyle,
        ]}
        // 포커스 핸들링: 래퍼 보더 전환
        onFocus={e => {
          setFocused(true)
          onFocus?.(e)
        }}
        onBlur={e => {
          setFocused(false)
          onBlur?.(e)
        }}
        // UX 권장
        autoCapitalize={inputProps.autoCapitalize ?? 'none'}
        autoCorrect={inputProps.autoCorrect ?? false}
        // 색상/커서
        placeholderTextColor={placeholderTextColor}
        selectionColor={COLORS.primary}
        // @ts-ignore (구형 타입 대응)
        cursorColor={COLORS.primary}
        // 안드로이드 기본 밑줄 제거
        underlineColorAndroid="transparent"
      />
    </View>
  )
}

const ERROR_COLOR = '#d32f2f'

const styles = StyleSheet.create({
  // 래퍼: 여기서 포커스/에러 하단 보더를 제어
  container: {
    width: '100%',
    backgroundColor: 'transparent',
    borderBottomWidth: 0, // 평상시 없음
  },
  containerFocused: {
    borderBottomWidth: 3, // 포커스 시 하단 보더
    borderColor: COLORS.primary,
    marginBottom: 4,
  },
  containerError: {
    borderColor: ERROR_COLOR, // 에러 시 색상만 교체
  },

  // 입력 필드 자체 스타일
  input: {
    paddingHorizontal: 0,
    fontSize: 14,
    fontFamily: 'Roboto',
    color: '#111',
    backgroundColor: 'transparent',
  },

  // 읽기 모드 텍스트
  fixedText: {
    fontFamily: 'BMDOHYEON',
    color: '#5D5D5D',
    fontSize: 12,
  },
})
