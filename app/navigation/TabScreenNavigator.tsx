import {tabScreens} from '@app/navigation/tabScreens'
import COLORS from '@app/shared/constants/color'
import {AppRouteParamList, TabParamList} from '@app/shared/types/navigate'
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'
import React, {useMemo} from 'react'
import {StyleSheet, View} from 'react-native'
import {Icon} from 'react-native-paper'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {ActionTabButton} from '../features/app/components/ActionTabBarButton'

const Tab = createBottomTabNavigator<TabParamList>()
const EmptyScreen: React.FC<any> = () => null

/** 탭바 기본 높이 (인셋 제외) */
const TAB_BAR_BASE_HEIGHT = 48

export default function TabScreenNavigator(): React.JSX.Element {
  const tabs = tabScreens()
  const insets = useSafeAreaInsets()

  // 탭바 및 스크린 래퍼의 다이나믹 스타일 계산
  const dynamicStyles = useMemo(() => {
    const totalHeight = TAB_BAR_BASE_HEIGHT + insets.bottom
    return {
      tabBar: {
        height: totalHeight,
        paddingTop: 8,
        paddingBottom: insets.bottom + 6,
      },
      screenWrapper: {
        paddingTop: insets.top,
        paddingBottom: totalHeight,
      },
    }
  }, [insets.top, insets.bottom])

  return (
    <Tab.Navigator
      screenOptions={({route}) => {
        const currentRoute = tabs.find(r => r.name === route.name)
        return {
          headerShown: false,
          tabBarIcon: ({focused, color}) => (
            <Icon
              source={currentRoute?.icon ?? 'help-circle-outline'}
              color={color}
              size={focused ? 26 : 24}
            />
          ),
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textSecondary,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarStyle: [styles.tabBar, dynamicStyles.tabBar],
        }
      }}>
      {tabs.map(route => {
        const ScreenComponent = (route.component ??
          EmptyScreen) as React.ComponentType<any>
        return (
          <Tab.Screen
            key={route.name}
            name={route.name}
            initialParams={route.getParams?.()}
            options={{
              title: route.title ?? route.name,
              tabBarButton: btnProps => (
                <ActionTabButton
                  {...btnProps}
                  target={route.path as keyof AppRouteParamList}
                  params={route.getParams?.()}
                  BadgeComponent={route.badge}
                />
              ),
            }}>
            {props => (
              <View
                style={[styles.screenContainer, dynamicStyles.screenWrapper]}>
                <ScreenComponent {...props} />
              </View>
            )}
          </Tab.Screen>
        )
      })}
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.background,
    borderTopWidth: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    position: 'absolute',
    // 그림자 설정
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 15,
  },
  tabBarLabel: {
    fontFamily: 'BMDOHYEON',
    fontSize: 11,
    marginBottom: 4,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
})
