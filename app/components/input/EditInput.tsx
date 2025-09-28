// components/inputs/EditInput.tsx
import React, {useMemo, useRef, useState, type ReactNode} from 'react'
import {
  Pressable,
  Text as RNText,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native'
import {Icon} from 'react-native-paper' // ✅ paper 없이 아이콘
import COLORS from '../../constants/color'

export type EditInputProps = Omit<RNTextInputProps, 'value' | 'style'> & {
  edit?: boolean
  type?: 'outlined' | 'borderless'
  containerStyle?: StyleProp<ViewStyle>
  value?: string | number | null | undefined
  style?: StyleProp<TextStyle>
  /** secureTextEntry가 있을 때 토글 아이콘 표시 여부 */
  showPasswordToggle?: boolean
  rightElement?: ReactNode
}

export default function EditInput({
  edit = true,
  type = 'borderless',
  containerStyle,
  style,
  value,
  onFocus,
  onBlur,
  showPasswordToggle = true,
  rightElement,
  ...rest
}: EditInputProps) {
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<RNTextInput>(null)

  // 부모가 paper 전용 props를 실수로 넘겨도 RN TextInput에 전달되지 않게 필터링
  const {
    // @ts-ignore
    right,
    left,
    mode,
    theme,
    underlineStyle,
    underlineColor,
    activeUnderlineColor,
    ...inputProps
  } = rest as any

  if (!edit) {
    return (
      <RNText style={styles.fixedText}>
        {typeof value === 'string'
          ? value
          : value == null
            ? ((inputProps as any)?.defaultValue ?? '-')
            : String(value)}
      </RNText>
    )
  }

  // 값은 항상 문자열로 보장
  const v =
    typeof value === 'string' ? value : value == null ? '' : String(value)

  const isOutlined = type === 'outlined'
  const isPasswordField = !!inputProps.secureTextEntry
  const [show, setShow] = useState(false)

  // 토글 사용 시 오른쪽 아이콘 공간만큼 패딩 확보
  const inputPaddingRight = useMemo(() => {
    if (!isPasswordField || !showPasswordToggle) return 0
    return 36 // 아이콘 + 여백
  }, [isPasswordField, showPasswordToggle])

  return (
    <View
      style={[
        styles.boxBase,
        isOutlined ? styles.boxOutlined : styles.boxBorderless,
        isOutlined
          ? focused
            ? styles.boxOutlinedFocused
            : styles.boxOutlinedBlurred
          : focused
            ? styles.boxBorderlessFocused
            : styles.boxBorderlessBlurred,
        containerStyle,
      ]}>
      <RNTextInput
        ref={inputRef}
        {...inputProps}
        value={v}
        // 비밀번호 토글 로직: secureTextEntry가 전달된 경우에만 토글
        secureTextEntry={isPasswordField ? !show : undefined}
        style={[
          styles.inputBase,
          isOutlined ? styles.inputOutlined : styles.inputBorderless,
          {paddingRight: inputPaddingRight},
          style,
        ]}
        underlineColorAndroid="transparent"
        selectionColor={COLORS.primary}
        // @ts-ignore (구형 타입 대응)
        cursorColor={COLORS.primary}
        onFocus={e => {
          setFocused(true)
          onFocus?.(e)
        }}
        onBlur={e => {
          setFocused(false)
          onBlur?.(e)
        }}
        placeholderTextColor="#000000"
      />

      {/* 오른쪽 토글 아이콘 (secureTextEntry 전달 + showPasswordToggle=true 일 때만) */}
      {isPasswordField && showPasswordToggle && (
        <Pressable
          onPress={() => {
            setShow(prev => !prev)
            // 포커스 유지
            requestAnimationFrame(() => inputRef.current?.focus())
          }}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={show ? '비밀번호 숨기기' : '비밀번호 보기'}
          style={styles.rightAdornment}>
          <Icon source={show ? 'eye-off' : 'eye'} size={22} color="#5D5D5D" />
        </Pressable>
      )}
      {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
    </View>
  )
}

const styles = StyleSheet.create({
  boxBase: {width: '100%', overflow: 'hidden'},
  boxBorderless: {borderRadius: 0},
  boxBorderlessBlurred: {borderBottomWidth: 0},
  boxBorderlessFocused: {
    borderBottomWidth: 3,
    borderColor: COLORS.primary,
    marginBottom: 4,
  },
  boxOutlined: {borderRadius: 16, borderWidth: 1, backgroundColor: '#FFF'},
  boxOutlinedBlurred: {borderColor: '#DFDFDF'},
  boxOutlinedFocused: {borderColor: COLORS.primary, borderWidth: 2},

  inputBase: {
    height: 60,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#000000',
    backgroundColor: 'transparent',
  },
  inputBorderless: {
    backgroundColor: 'transparent',
    height: 40,
    paddingHorizontal: 0,
  },
  inputOutlined: {backgroundColor: 'transparent'},

  fixedText: {fontFamily: 'BMDOHYEON', color: '#5D5D5D', fontSize: 12},

  rightAdornment: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  rightElement: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
})
