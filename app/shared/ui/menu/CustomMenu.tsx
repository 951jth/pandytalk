import COLORS from '@app/shared/constants/color'
import React from 'react'
import {StyleProp, TextStyle, View, ViewStyle} from 'react-native'
import {IconButton, Menu} from 'react-native-paper'

export interface MenuItem {
  title: string
  onPress: () => void
  icon?: string
  color?: string
  disabled?: boolean
  titleStyle?: StyleProp<TextStyle>
}

interface CustomMenuProps {
  visible: boolean
  onOpen: () => void
  onClose: () => void
  items?: MenuItem[] // ✅ JSON 데이터 배열 추가
  anchorIcon?: string
  anchorSize?: number
  anchorColor?: string
  anchorStyle?: StyleProp<ViewStyle>
  contentStyle?: StyleProp<ViewStyle>
  children?: React.ReactNode // (선택적) 기존 방식 유지
  style?: StyleProp<ViewStyle>
}

/**
 * 전역 공통 드랍다운 메뉴 컴포넌트 (데이터 기반)
 */
export const CustomMenu: React.FC<CustomMenuProps> = ({
  visible,
  onOpen,
  onClose,
  items = [],
  anchorIcon = 'dots-vertical',
  anchorSize = 24,
  anchorColor = COLORS.primary,
  anchorStyle,
  contentStyle,
  children,
  style,
}) => {
  const [menuKey, setMenuKey] = React.useState(0)

  // 메뉴가 열릴 때마다 Menu 내부 상태를 초기화하기 위해 key를 변경 (RN Paper 버그 우회)
  React.useEffect(() => {
    if (visible) {
      setMenuKey(prev => prev + 1)
    }
  }, [visible])

  return (
    <View style={style} collapsable={false}>
      {/* 1. 항상 화면에 유지되는 진짜 앵커 버튼 (터치 리플 끊김 방지) */}
      <IconButton
        icon={anchorIcon}
        size={anchorSize}
        iconColor={anchorColor}
        onPress={onOpen}
        style={anchorStyle}
      />

      {/* 2. RN Paper Menu 전용 렌더링 영역 (가짜 앵커 사용) */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        pointerEvents="none">
        <Menu
          key={`paper-menu-${menuKey}`}
          visible={visible}
          onDismiss={onClose}
          anchor={<View style={{width: 1, height: 1}} />}
          contentStyle={[
            {
              backgroundColor: COLORS.white,
              borderRadius: 16,
              paddingVertical: 8,
              elevation: 5,
              shadowColor: '#000',
              shadowOffset: {width: 0, height: 2},
              shadowOpacity: 0.2,
              shadowRadius: 4,
            },
            contentStyle,
          ]}>
          {/* JSON 기반 아이템 렌더링 */}
          {items.map((item, idx) => (
            <Menu.Item
              key={`menu-item-${idx}`}
              onPress={() => {
                onClose() // 메뉴 닫기 자동화
                item.onPress()
              }}
              title={item.title}
              leadingIcon={item.icon}
              disabled={item.disabled}
              titleStyle={[
                item.color ? {color: item.color} : null,
                item.titleStyle,
              ]}
            />
          ))}
          {/* 기존 Children 방식 (필요 시) */}
          {children}
        </Menu>
      </View>
    </View>
  )
}
