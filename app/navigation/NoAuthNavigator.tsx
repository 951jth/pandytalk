import {createNativeStackNavigator} from '@react-navigation/native-stack'
import React from 'react'
import {noAuthRoutes} from '../hooks/useRoutes'

export default function NoAuthNavigator() {
  const Stack = createNativeStackNavigator()
  console.log('noAuthRoutes', noAuthRoutes)
  return (
    <Stack.Navigator initialRouteName={'login'}>
      {noAuthRoutes?.map(route => {
        return (
          <Stack.Screen
            key={route.name}
            name={route.name}
            options={{headerShown: false}}
            component={route?.component}
          />
        )
      })}
    </Stack.Navigator>
  )
}
