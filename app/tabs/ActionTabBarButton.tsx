import type {BottomTabBarButtonProps} from '@react-navigation/bottom-tabs'
import {useNavigation} from '@react-navigation/native'
import type {NativeStackNavigationProp} from '@react-navigation/native-stack'
import React from 'react'
import {TouchableOpacity, type TouchableOpacityProps} from 'react-native'
import type {AppRouteParamList} from '../types/navigate'

type AppNav = NativeStackNavigationProp<AppRouteParamList>

type ActionTabButtonProps = BottomTabBarButtonProps & {
  target?: keyof AppRouteParamList // 이동할 탭 이름
  params?: AppRouteParamList[keyof AppRouteParamList] // 탭에 보낼 params
}

export function ActionTabButton({
  target,
  params,
  accessibilityRole,
  accessibilityState,
  accessibilityLabel,
  testID,
  style,
  hitSlop,
  delayLongPress,
  children,
  onPress,
  //   ...rest
}: ActionTabButtonProps) {
  const rootNav = useNavigation().getParent<AppNav>()

  return (
    <TouchableOpacity
      // ⬇️ 필요한 것만 명시적으로 매핑 (null → undefined 정규화)
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={style as TouchableOpacityProps['style']}
      hitSlop={hitSlop as TouchableOpacityProps['hitSlop']}
      delayLongPress={delayLongPress ?? undefined}
      onPress={() => {
        if (target) {
          // (2) path가 있으면: 탭 전환 막고 → 부모 스택으로 push
          rootNav.navigate(target, params as any) // 필요하면 제네릭으로 더 좁혀도 됩니다)
        } else {
          // (1) path가 없으면: 기본 탭 동작(해당 Tab.Screen으로 전환)
          onPress?.({} as any)
        }
      }}
      //   onLongPress={onLongPress}
    >
      {children}
    </TouchableOpacity>
  )
}
