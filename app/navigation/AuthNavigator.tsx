import {createNativeStackNavigator} from '@react-navigation/native-stack'
import React from 'react'
import {authRoutes, initialRouteName} from '../hooks/useRoutes'

const Stack = createNativeStackNavigator()

export default function AuthNavigator() {
  const routes = authRoutes()

  return (
    <Stack.Navigator initialRouteName={initialRouteName}>
      {routes.flatMap(layoutGroup =>
        layoutGroup.children.map(route => (
          <Stack.Screen
            key={route.name}
            name={route.name}
            options={layoutGroup.options || route.options}>
            {(props: any) => {
              const Component = route.component
              const Layout = layoutGroup.layout

              return Layout ? (
                <Layout>
                  <Component {...props} />
                </Layout>
              ) : (
                <Component {...props} />
              )
            }}
          </Stack.Screen>
        )),
      )}
    </Stack.Navigator>
  )
}
