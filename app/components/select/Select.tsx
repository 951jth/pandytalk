// components/inputs/Select.tsx
import React, {useMemo, useRef, useState} from 'react'
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import COLORS from '../../constants/color'

type Option<T extends string | number> = {label: string; value: T}

export type SelectProps<T extends string | number = string> = {
  value?: T | null
  options: Option<T>[] // 부모가 동적으로 관리
  onChange: (value: T, option: Option<T>) => void
  placeholder?: string
  disabled?: boolean
  error?: boolean

  /** 오토컴플리트 */
  autocomplete?: boolean // true면 상단 검색창 노출
  onTextChange?: (q: string) => void // 입력 변화 전달 (선택)
  loading?: boolean // 외부 로딩 표시 (선택)

  /** 스타일 */
  type?: 'outlined' | 'borderless'
  containerStyle?: StyleProp<ViewStyle>
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
  listStyle?: StyleProp<ViewStyle>
}

export default function Select<T extends string | number = string>({
  value = null,
  options,
  onChange,
  placeholder = '선택하세요',
  disabled,
  error,
  autocomplete = false,
  onTextChange,
  loading = false,
  type = 'borderless',
  containerStyle,
  style,
  textStyle,
  listStyle,
}: SelectProps<T>) {
  const anchorRef = useRef<View>(null)
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const [anchor, setAnchor] = useState({x: 0, y: 0, w: 0, h: 0})
  const [text, setText] = useState('')
  const insets = useSafeAreaInsets()

  const selected = useMemo(
    () => options.find(o => o.value === value) ?? null,
    [options, value],
  )

  const openMenu = () => {
    if (disabled) return
    anchorRef.current?.measureInWindow((x, y, w, h) => {
      setAnchor({x, y, w, h})
      setOpen(true)
      setFocused(true)
      // 필요하면 열릴 때 초기 조회 트리거
      if (autocomplete && onTextChange) onTextChange(text)
    })
  }

  const closeMenu = () => {
    setOpen(false)
    setFocused(false)
    setText('')
    if (autocomplete && onTextChange) onTextChange('') // 필요 없으면 지워도 됨
  }

  // 드롭다운 위치 계산
  const {height: screenH} = Dimensions.get('window')
  const GAP = 6
  const SAFE = 12
  const MAX_LIST = 300
  const spaceBelow = screenH - (anchor.y + anchor.h + insets.bottom) - SAFE
  const spaceAbove = anchor.y - SAFE - insets.top
  const openUp = spaceAbove >= spaceBelow
  const maxH = Math.min(MAX_LIST, openUp ? spaceAbove : spaceBelow)
  const positionStyle = openUp
    ? {bottom: spaceBelow + anchor.h - GAP - SAFE}
    : {top: spaceAbove + GAP + anchor.h}

  return (
    <View
      ref={anchorRef}
      style={[
        styles.container,
        type === 'outlined' ? styles.boxOutlined : styles.boxBorderless,
        type === 'outlined'
          ? focused
            ? styles.boxOutlinedFocused
            : styles.boxOutlinedBlurred
          : focused
            ? styles.boxBorderlessFocused
            : styles.boxBorderlessBlurred,
        error && styles.boxError,
        containerStyle,
      ]}>
      <Pressable
        onPress={openMenu}
        disabled={disabled}
        style={[styles.trigger, style]}
        android_ripple={{color: '#00000011'}}>
        <Text
          numberOfLines={1}
          style={[
            styles.valueText,
            !selected && styles.placeholder,
            textStyle,
          ]}>
          {selected ? selected.label : placeholder}
        </Text>
        <Text style={styles.chevron}>{open ? '▴' : '▾'}</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />
        <View
          style={[
            styles.dropdown,
            {
              position: 'absolute',
              left: anchor.x,
              width: anchor.w,
              maxHeight: maxH,
              ...positionStyle,
            },
            listStyle,
          ]}>
          {autocomplete && (
            <TextInput
              value={text}
              onChangeText={t => {
                setText(t)
                onTextChange?.(t)
              }}
              placeholder="검색"
              placeholderTextColor="#9AA0A6"
              style={styles.search}
              autoCorrect={false}
              autoCapitalize="none"
            />
          )}

          <FlatList
            data={options}
            keyExtractor={item => String(item.value)}
            keyboardShouldPersistTaps="handled"
            renderItem={({item}) => {
              const active = item.value === value
              return (
                <Pressable
                  onPress={() => {
                    onChange(item.value, item)
                    closeMenu()
                  }}
                  style={({pressed}) => [
                    styles.item,
                    pressed && styles.itemPressed,
                    active && styles.itemActive,
                  ]}>
                  <Text numberOfLines={1} style={styles.itemText}>
                    {item.label}
                  </Text>
                  {active && <Text style={styles.check}>✓</Text>}
                </Pressable>
              )
            }}
            ListFooterComponent={
              loading ? (
                <View style={{paddingVertical: 10, alignItems: 'center'}}>
                  <ActivityIndicator color={COLORS.primary} />
                </View>
              ) : null
            }
          />
        </View>
      </Modal>
    </View>
  )
}

const ERROR_COLOR = '#d32f2f'

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  // borderless
  boxBorderless: {borderRadius: 0},
  boxBorderlessBlurred: {borderBottomWidth: 0},
  boxBorderlessFocused: {
    borderBottomWidth: 3,
    borderColor: COLORS.primary,
    marginBottom: 4,
  },
  // outlined
  boxOutlined: {borderRadius: 16, backgroundColor: '#FFF'},
  boxOutlinedBlurred: {borderWidth: 1, borderColor: '#DFDFDF'},
  boxOutlinedFocused: {borderWidth: 2, borderColor: COLORS.primary},

  boxError: {borderColor: ERROR_COLOR},

  trigger: {
    minHeight: 40,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  valueText: {
    flex: 1,
    fontSize: 14,
    color: '#111',
  },
  placeholder: {color: '#9AA0A6'},
  chevron: {marginLeft: 8, color: '#5D5D5D'},

  dropdown: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFDFDF',
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4},
  },

  search: {
    height: 40,
    borderBottomWidth: 1,
    borderColor: '#EEE',
    paddingHorizontal: 10,
    fontSize: 14,
    color: '#111',
  },

  item: {
    minHeight: 44,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemPressed: {backgroundColor: '#F6F7F9'},
  itemActive: {backgroundColor: '#EEF6FF'},
  itemText: {fontSize: 14, color: '#111', flex: 1, paddingRight: 8},
  check: {color: COLORS.primary, marginLeft: 8},
})
