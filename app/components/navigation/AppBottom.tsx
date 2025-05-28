// AppContents.tsx
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'
import React from 'react'
import {Icon} from 'react-native-paper'
import COLORS from '../../constants/color'
import {authRoutes} from '../../hooks/useRoutes'

const Tab = createBottomTabNavigator()

const AppBottom: React.FC = () => {
  const authRouteConfig = authRoutes()?.[0]
  const routes = authRouteConfig.children

  return (
    <Tab.Navigator
      screenOptions={({route}) => {
        const currentRoute = routes.find(r => `${r.name}Tab` === route.name)

        return {
          headerShown: false,
          tabBarIcon: ({focused, color, size}) => (
            <Icon
              source={
                focused
                  ? currentRoute?.icon
                  : currentRoute?.icon || 'help-circle-outline'
              }
              color={color}
              size={size}
            />
          ),
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: '#000000',
          tabBarStyle: {
            backgroundColor: '#fff',
            elevation: 0,
            borderTopWidth: 0.25,
            borderTopColor: '#ddd',
          },
        }
      }}>
      {routes.map(route => (
        <Tab.Screen
          key={route.name}
          name={`${route.name}Tab`}
          component={route.component}
          options={{title: route.title ?? route.name}}
        />
      ))}
    </Tab.Navigator>
  )
}

export default AppBottom
