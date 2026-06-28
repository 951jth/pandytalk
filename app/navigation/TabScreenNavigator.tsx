import {useTabScreens} from '@app/navigation/useTabScreens'
import COLORS from '@app/shared/constants/color'
import {TabParamList} from '@app/shared/types/navigate'
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'
import React from 'react'
import {StyleSheet} from 'react-native'
import {Icon} from 'react-native-paper'
import {ActionTabButton} from '../features/app/components/ActionTabBarButton'

const Tab = createBottomTabNavigator<TabParamList>()
const EmptyScreen = () => null

/** 탭바 기본 높이 */
const TAB_BAR_HEIGHT = 64

type TabBarIconProps = {
  focused: boolean
  color: string
}

const createTabBarIcon =
  (icon?: string) =>
  ({focused, color}: TabBarIconProps) => (
    <Icon
      source={icon ?? 'help-circle-outline'}
      color={color}
      size={focused ? 26 : 24}
    />
  )

export default function TabScreenNavigator(): React.JSX.Element {
  const tabs = useTabScreens()

  return (
    <Tab.Navigator
      screenOptions={({route}) => {
        const currentRoute = tabs.find(r => r.name === route.name)
        return {
          headerShown: false,
          tabBarIcon: createTabBarIcon(currentRoute?.icon),
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textSecondary,
          tabBarShowLabel: true,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarItemStyle: {justifyContent: 'center'}, // 중앙 정렬 명시
          tabBarStyle: styles.tabBar,
          sceneStyle: styles.screenContainer,
        }
      }}>
      {tabs.map(route => {
        if (route.path) {
          const params = route.getParams()

          return (
            <Tab.Screen
              key={route.name}
              name={route.name}
              component={EmptyScreen}
              options={{
                title: route.title ?? route.name,
                tabBarButton: btnProps =>
                  React.createElement(ActionTabButton, {
                    ...btnProps,
                    name: route.name,
                    disabled: route.disabled,
                    target: route.path,
                    params,
                    BadgeComponent: route.badge,
                  }),
              }}
            />
          )
        }

        const params = route.getParams?.()
        const ScreenComponent = route.component
        return (
          <Tab.Screen
            key={route.name}
            name={route.name}
            component={ScreenComponent}
            initialParams={params}
            options={{
              title: route.title ?? route.name,
              tabBarButton: btnProps =>
                React.createElement(ActionTabButton, {
                  ...btnProps,
                  name: route.name,
                  disabled: route.disabled,
                  BadgeComponent: route.badge,
                }),
            }}
          />
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
    height: TAB_BAR_HEIGHT,
    paddingBottom: 4, // 라벨 아래쪽 미세 여백
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
    paddingBottom: TAB_BAR_HEIGHT,
  },
})
