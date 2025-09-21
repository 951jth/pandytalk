// components/inputs/Select.tsx
import React, {useMemo, useRef, useState} from 'react'
import {
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
  options: Option<T>[]
  onChange: (value: T, option: Option<T>) => void
  placeholder?: string
  disabled?: boolean
  error?: boolean
  searchable?: boolean

  /** 스타일 */
  type?: 'outlined' | 'borderless'
  containerStyle?: StyleProp<ViewStyle> // 바깥 래퍼(보더/레이아웃)
  style?: StyleProp<ViewStyle> // 트리거 영역
  textStyle?: StyleProp<TextStyle> // 선택 텍스트
  listStyle?: StyleProp<ViewStyle> // 드롭다운 박스
}

// function measureAnchorWithInsets(
//   ref: React.RefObject<View>,
//   yOffset: number,
// ): Promise<Anchor> {
//   return new Promise(resolve => {
//     ref.current?.measureInWindow((x, y, w, h) => {
//       resolve({x, y: y + yOffset, w, h})
//     })
//   })
// }

export default function Select<T extends string | number = string>({
  value = null,
  options,
  onChange,
  placeholder = '선택하세요',
  disabled,
  error,
  searchable = false,
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
  const [query, setQuery] = useState('')
  const insets = useSafeAreaInsets()
  const selected = useMemo(
    () => options.find(o => o.value === value) ?? null,
    [options, value],
  )
  const headerHeight = 0 //네비게이션 헤더 사용시
  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return options
    const q = query.trim().toLowerCase()
    return options.filter(o => o.label.toLowerCase().includes(q))
  }, [options, searchable, query])

  const openMenu = () => {
    if (disabled) return

    anchorRef.current?.measureInWindow((x, y, w, h) => {
      setAnchor({x, y, w, h})
      setOpen(true)
      setFocused(true)
    })
  }

  // const openMenu = async () => {
  //   if (disabled) return
  //   // SafeArea 상단(insets.top) + (선택)헤더 높이를 더해 보정
  //   const yOffset = insets.top + headerHeight

  //   const a = await measureAnchorWithInsets(anchorRef, yOffset)
  //   setAnchor(a)
  //   setOpen(true)
  //   setFocused(true)
  // }

  const closeMenu = () => {
    setOpen(false)
    setFocused(false)
    setQuery('')
  }

  // ── 드롭다운 위치 계산(아래 공간 부족하면 위로 띄움)
  const {height: screenH} = Dimensions.get('window')
  const GAP = 6 // 트리거와 드롭다운 사이 여백
  const SAFE = 12 // 화면 경계 여백
  const MAX_LIST = 300

  const spaceBelow = screenH - (anchor.y + anchor.h + insets.bottom) - SAFE // 아래 여백 공간
  const spaceAbove = anchor.y - SAFE - insets.top //위 여백 공간

  // 아래 공간이 부족하고 위가 더 넓으면 위로 오픈
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
        {/* 배경 클릭으로 닫기 */}
        <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />

        <View
          style={[
            styles.dropdown,
            {
              position: 'absolute',
              left: anchor.x,
              width: anchor.w,
              maxHeight: maxH,
              ...positionStyle, // ← 위/아래 자동 배치
            },
            listStyle,
          ]}>
          {searchable && (
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="검색"
              placeholderTextColor="#9AA0A6"
              style={styles.search}
              autoCorrect={false}
              autoCapitalize="none"
            />
          )}

          <FlatList
            data={filtered}
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

  // borderless(밑줄 스타일)
  boxBorderless: {borderRadius: 0},
  boxBorderlessBlurred: {borderBottomWidth: 0},
  boxBorderlessFocused: {
    borderBottomWidth: 3,
    borderColor: COLORS.primary,
    marginBottom: 4,
  },

  // outlined(사각 보더)
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
    elevation: 6, // Android shadow
    shadowColor: '#000', // iOS shadow
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
