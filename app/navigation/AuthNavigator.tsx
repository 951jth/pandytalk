import {createNativeStackNavigator} from '@react-navigation/native-stack'
import React from 'react'
import {View} from 'react-native'
import {authRoutes, initialRouteName} from '../hooks/useRoutes'

const Stack = createNativeStackNavigator()

export default function AuthNavigator() {
  // const routes = useMemo(() => authRoutes(), [])
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
              const Layout = layoutGroup.layout || <View></View>
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
