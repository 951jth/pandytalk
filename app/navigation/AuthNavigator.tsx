import {createNativeStackNavigator} from '@react-navigation/native-stack'
import React from 'react'
import {authRoutes, initialRouteName} from '../hooks/useRoutes'

export default function AuthNavigator() {
  const Stack = createNativeStackNavigator()
  return (
    <Stack.Navigator initialRouteName={initialRouteName}>
      {authRoutes().flatMap(layoutGroup =>
        layoutGroup.children.map(route => (
          <Stack.Screen
            key={route.name}
            name={route.name}
            options={layoutGroup.options || route.options}
            children={props => (
              <layoutGroup.layout>
                <route.component {...props} />
              </layoutGroup.layout>
            )}
          />
        )),
      )}
    </Stack.Navigator>
  )
}
