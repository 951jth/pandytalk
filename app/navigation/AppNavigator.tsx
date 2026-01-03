import {appRoutes} from '@app/navigation/useScreens'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import React from 'react'
// import {navigate} from '../components/navigation/RootNavigation'

const Stack = createNativeStackNavigator()

export default function AppNavigator() {
  const routes = appRoutes()

  return (
    <Stack.Navigator>
      {routes.flatMap(layoutGroup =>
        layoutGroup.children.map(route => (
          <Stack.Screen
            key={route.name}
            name={route.name}
            options={layoutGroup.options || route.options}>
            {(props: any) => {
              const Component = route.component ?? React.Fragment
              const Layout = layoutGroup.layout ?? React.Fragment

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
