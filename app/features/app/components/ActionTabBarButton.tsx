import type {BottomTabBarButtonProps} from '@react-navigation/bottom-tabs'
import {useNavigation} from '@react-navigation/native'
import type {NativeStackNavigationProp} from '@react-navigation/native-stack'
import React from 'react'
import {
  Alert,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import type {AppRouteParamList} from '../../../shared/types/navigate'
import PressableWrapper from '../../../shared/ui/common/PressableWrapper'

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
  ...rest
}: ActionTabButtonProps) {
  const rootNav = useNavigation().getParent<AppNav>()
  const isFocused = rest.accessibilityState?.selected

  return (
    <PressableWrapper
      {...rest}
      style={[
        rest.style as StyleProp<ViewStyle>,
        {transform: [{scale: isFocused ? 1.05 : 1}]},
      ]}
      onPress={() => {
        if (disabled) {
          Alert.alert(
            '승인 대기 중',
            '현재 승인 대기 중입니다. 관리자에게 문의해주세요.',
          )
          return
        }

        if (target) {
          // (2) target이 있으면: 탭 전환 막고 → 부모 스택으로 push
          if (target === 'dm-chat') {
            rootNav?.navigate('dm-chat', params as AppRouteParamList['dm-chat'])
          } else if (target === 'group-chat') {
            rootNav?.navigate(
              'group-chat',
              params as AppRouteParamList['group-chat'],
            )
          } else if (target === 'chats') {
            rootNav?.navigate('chats', params as AppRouteParamList['chats'])
          } else {
            rootNav?.navigate(target)
          }
        } else {
          // (1) target이 없으면: 기본 탭 동작(해당 Tab.Screen으로 전환)
          rest.onPress?.({} as GestureResponderEvent)
        }
      }}>
      {rest.children}
      {BadgeComponent && (
        <View style={styles.badge}>
          <BadgeComponent />
        </View>
      )}
    </PressableWrapper>
  )
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 0,
    right: 10,
  },
})
