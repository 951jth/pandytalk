import React from 'react'
import {StyleProp, ViewStyle, TextStyle, View} from 'react-native'
import {IconButton, Menu} from 'react-native-paper'
import COLORS from '@app/shared/constants/color'

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
  return (
    <View style={style}>
      <Menu
        visible={visible}
        onDismiss={onClose}
        anchor={
          <IconButton
            icon={anchorIcon}
            size={anchorSize}
            iconColor={anchorColor}
            onPress={onOpen}
            style={anchorStyle}
          />
        }
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
        {/* 1. JSON 기반 아이템 렌더링 */}
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

        {/* 2. 기존 Children 방식 (필요 시) */}
        {children}
      </Menu>
    </View>
  )
}
