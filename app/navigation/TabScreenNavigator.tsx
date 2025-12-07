import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'
import React from 'react'
import {Icon} from 'react-native-paper'
import COLORS from '../constants/color'
import {ActionTabButton} from '../features/app/components/ActionTabBarButton'
import {tabScreens} from '../features/app/hooks/useScreens'
import {useAppSelector} from '../store/reduxHooks'
import type {AppRouteParamList} from '../types/navigate'

const Tab = createBottomTabNavigator()
const EmptyScreen: React.FC = () => null

export default function TabScreenNavigator(): React.JSX.Element {
  const tabs = tabScreens()
  const {data: user} = useAppSelector(state => state?.user)
  const isAdmin = user?.authority == 'ADMIN' // 혹은 user?.isAdmin

  // useSubscribeChatList(user?.uid, 'dm') //채팅 벳지 카운트떄문에 탭 상단으로 이동.
  // useSubscribeChatList(isAdmin ? user?.uid : null, 'group') //그룹채팅은 관리자 일떄만 활성화 시킴

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
              size={size}
            />
          ),
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: '#000000',
          tabBarLabelStyle: {
            fontFamily: 'BMDOHYEON', // 👈 로컬 폰트 이름
            fontSize: 10,
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
