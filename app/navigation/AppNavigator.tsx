import {appRoutes, initialRouteName} from '@app/navigation/useScreens'
import type {AppRouteParamList} from '@app/shared/types/navigate'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import React, {useEffect} from 'react'
import {setAppNavigationReady} from './RootNavigation'
// import {navigate} from '../components/navigation/RootNavigation'

const Stack = createNativeStackNavigator<AppRouteParamList>()

export default function AppNavigator() {
  const routes = appRoutes()

  useEffect(() => {
    // AppStack이 실제로 마운트된 뒤 외부 네비게이션 queue를 다시 확인합니다.
    setAppNavigationReady(true)
  }, [])

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
