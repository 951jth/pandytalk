import type {BottomTabBarButtonProps} from '@react-navigation/bottom-tabs'
import {useNavigation} from '@react-navigation/native'
import type {NativeStackNavigationProp} from '@react-navigation/native-stack'
import React from 'react'
import {
  Alert,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import type {AppRouteParamList} from '@app/navigation/types'

type AppNav = NativeStackNavigationProp<AppRouteParamList>

type ActionTabButtonProps = BottomTabBarButtonProps & {
  name?: string // 탭 식별 고유 이름
  target?: keyof AppRouteParamList // 이동할 탭 이름
  params?: AppRouteParamList[keyof AppRouteParamList] // 탭에 보낼 params
  BadgeComponent?: React.ComponentType
}

export function ActionTabButton({
  name: _name,
  disabled,
  target,
  params,
  BadgeComponent,
  ref: _ref,
  ...rest
}: ActionTabButtonProps) {
  const rootNav = useNavigation().getParent<AppNav>()
  const isFocused = rest.accessibilityState?.selected
  const getButtonStyle = (state: PressableStateCallbackType) => {
    const rawStyle = rest.style as PressableProps['style']
    const baseStyle =
      typeof rawStyle === 'function' ? rawStyle(state) : rawStyle
    const stateScale = (isFocused ? 1.05 : 1) * (state.pressed ? 0.99 : 1)

    return [
      baseStyle as StyleProp<ViewStyle>,
      {transform: [{scale: stateScale}]},
    ]
  }

  return (
    <Pressable
      {...rest}
      accessibilityRole="button"
      style={getButtonStyle}
      onPress={event => {
        if (disabled) {
          Alert.alert(
            '승인 대기 중',
            '현재 승인 대기 중입니다. 관리자에게 문의해주세요.',
          )
          return
        }

        if (target) {
          // (2) target이 있으면: 탭 전환 막고 → 부모 스택으로 push
          navigateToTarget(rootNav, target, params)
        } else {
          // (1) target이 없으면: 기본 탭 동작(해당 Tab.Screen으로 전환)
          rest.onPress?.(event)
        }
      }}>
      {rest.children}
      {BadgeComponent && (
        <View style={styles.badge}>
          <BadgeComponent />
        </View>
      )}
    </Pressable>
  )
}

type AppRouteNavigate = (
  target: keyof AppRouteParamList,
  params?: AppRouteParamList[keyof AppRouteParamList],
) => void

function navigateToTarget(
  rootNav: AppNav | undefined,
  target: keyof AppRouteParamList,
  params?: AppRouteParamList[keyof AppRouteParamList],
) {
  if (!rootNav) {
    return
  }

  const navigate = rootNav.navigate as AppRouteNavigate
  navigate(target, params)
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 0,
    right: 10,
  },
})
