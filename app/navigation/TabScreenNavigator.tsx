import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'
import React from 'react'
import {Icon} from 'react-native-paper'
import COLORS from '../constants/color'
import {tabScreens} from '../hooks/useScreens'
import {useAppSelector} from '../store/reduxHooks'

const Tab = createBottomTabNavigator()

export default function TabScreenNavigator(): React.JSX.Element {
  const {data: user} = useAppSelector(state => state?.user)
  // const tabs = useMemo(() => tabScreens(), [user])
  const tabs = tabScreens()
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
          component={route.component}
          options={{title: route.title ?? route.name}}
        />
      ))}
    </Tab.Navigator>
  )
}
