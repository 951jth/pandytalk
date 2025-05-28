import {createNativeStackNavigator} from '@react-navigation/native-stack'
import React from 'react'
import {authRoutes, initialRouteName} from '../hooks/useRoutes'

const Stack = createNativeStackNavigator()

export default function AuthNavigator() {
  return (
    <Stack.Navigator initialRouteName={initialRouteName}>
      {authRoutes().flatMap(layoutGroup =>
        layoutGroup.children.map(route => (
          <Stack.Screen
            key={route.name}
            name={route.name}
            options={layoutGroup.options || route.options}>
            {(props: any) => {
              const Layout = layoutGroup.layout
              const Component = route.component
              return (
                <Layout>
                  <Component {...props} />
                </Layout>
              )
            }}
          </Stack.Screen>
        )),
      )}
    </Stack.Navigator>
  )
}
