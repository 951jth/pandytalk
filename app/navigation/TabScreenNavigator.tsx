import {tabScreens} from '@app/navigation/tabScreens'
import COLORS from '@app/shared/constants/color'
import {AppRouteParamList} from '@app/shared/types/navigate'
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'
import React from 'react'
import {Icon} from 'react-native-paper'
import {ActionTabButton} from '../features/app/components/ActionTabBarButton'
import {useAppSelector} from '../store/reduxHooks'

const Tab = createBottomTabNavigator()
const EmptyScreen: React.FC = () => null

export default function TabScreenNavigator(): React.JSX.Element {
  const tabs = tabScreens()
  const {data: user} = useAppSelector(state => state?.user)

  return (
    <Tab.Navigator
      screenOptions={({route}) => {
        const currentRoute = tabs.find(r => r.name === route.name)
        return {
          headerShown: false,
          tabBarIcon: ({focused, color, size}) => (
            <Icon
              source={currentRoute?.icon ?? 'help-circle-outline'}
              color={color}
              size={focused ? 26 : 24} // active시에 약간 크게
            />
          ),
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textSecondary,
          tabBarLabelStyle: {
            fontFamily: 'BMDOHYEON',
            fontSize: 11,
            marginBottom: 4,
          },
          tabBarStyle: {
            backgroundColor: COLORS.background,
            borderTopWidth: 0, // 기본 보더 제거
            height: 65,
            paddingBottom: 10,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            // 탭바 상단 그림자 (Floating 느낌)
            shadowColor: '#000',
            shadowOffset: {width: 0, height: -4},
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 15,
            position: 'absolute', // 살짝 떠있는 느낌을 위해 (스크린 paddingBottom 필요)
          },
        }
      }}>
      {tabs.map(route => (
        <Tab.Screen
          key={route.name}
          name={route.name}
          component={route.component ?? EmptyScreen}
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
          }}
        />
      ))}
    </Tab.Navigator>
  )
}
