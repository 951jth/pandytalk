import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'
import React from 'react'
import {StyleSheet} from 'react-native'
import {Icon} from 'react-native-paper'
import COLORS from '../../constants/color'
import {tabScreens} from '../../hooks/useRoutes'

const Tab = createBottomTabNavigator()

export default function TabContents(): React.JSX.Element {
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

const styles = StyleSheet.create({
  bottomNavigator: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3, // Android 그림자
  },
})
