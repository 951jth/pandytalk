import {appRoutes, initialRouteName} from '@app/navigation/useScreens'
import type {AppRouteParamList} from '@app/navigation/types'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import React from 'react'
// import {navigate} from '@app/navigation/navigationRef'

const Stack = createNativeStackNavigator<AppRouteParamList>()

export default function AppNavigator() {
  const routes = appRoutes()

  return (
    <Stack.Navigator initialRouteName={initialRouteName}>
      {routes.flatMap(layoutGroup =>
        layoutGroup.children.map(route => (
          <Stack.Screen
            key={route.name}
            name={route.name}
            options={layoutGroup.options || route.options}>
            {() => {
              const Component = route.component ?? React.Fragment
              const Layout = layoutGroup.layout ?? React.Fragment

              return (
                <Layout>
                  <Component />
                </Layout>
              )
            }}
          </Stack.Screen>
        )),
      )}
    </Stack.Navigator>
  )
}
