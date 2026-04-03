import type {BottomTabBarButtonProps} from '@react-navigation/bottom-tabs'
import {useNavigation} from '@react-navigation/native'
import type {NativeStackNavigationProp} from '@react-navigation/native-stack'
import React from 'react'
import {StyleSheet, View} from 'react-native'

import type {AppRouteParamList} from '../../../shared/types/navigate'
import PressableWrapper from '../../../shared/ui/common/PressableWrapper'

type AppNav = NativeStackNavigationProp<AppRouteParamList>

type ActionTabButtonProps = BottomTabBarButtonProps & {
  target?: keyof AppRouteParamList // 이동할 탭 이름
  params?: AppRouteParamList[keyof AppRouteParamList] // 탭에 보낼 params
  BadgeComponent?: React.ComponentType<any>
}

export function ActionTabButton({
  target,
  params,
  BadgeComponent,
  accessibilityRole,
  accessibilityState,
  accessibilityLabel,
  testID,
  style,
  hitSlop,
  delayLongPress,
  children,
  onPress,
}: ActionTabButtonProps) {
  const rootNav = useNavigation().getParent<AppNav>()
  const isFocused = accessibilityState?.selected

  return (
    <PressableWrapper
      // ⬇️ 필요한 것만 명시적으로 매핑
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[
        style as any,
        {transform: [{scale: isFocused ? 1.05 : 1}]},
      ]}
      hitSlop={hitSlop as any}
      delayLongPress={delayLongPress ?? undefined}
      onPress={() => {
        if (target) {
          // (2) target이 있으면: 탭 전환 막고 → 부모 스택으로 push
          rootNav?.navigate(target as any, params as any)
        } else {
          // (1) target이 없으면: 기본 탭 동작(해당 Tab.Screen으로 전환)
          onPress?.({} as any)
        }
      }}>
      <View style={{alignItems: 'center', justifyContent: 'center'}}>
        {children}
      </View>
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
