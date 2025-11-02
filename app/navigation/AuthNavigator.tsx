import {createNativeStackNavigator} from '@react-navigation/native-stack'
import React, {Fragment} from 'react'
import {authRoutes} from '../hooks/useScreens'

export default function AuthNavigator() {
  const Stack = createNativeStackNavigator()
  return (
    <Stack.Navigator initialRouteName={'login'}>
      {authRoutes?.map(route => {
        return (
          <Stack.Screen
            key={route.name}
            name={route.name}
            options={{headerShown: false}}
            component={route?.component ?? Fragment}
          />
        )
      })}
    </Stack.Navigator>
  )
}
