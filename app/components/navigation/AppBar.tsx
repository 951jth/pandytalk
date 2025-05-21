import {useNavigation, useRoute} from '@react-navigation/native'
import React from 'react'
import {Appbar} from 'react-native-paper'
import {authRoutes} from '../../hooks/useRoutes'

export default function AppBar() {
  const navigation = useNavigation()
  const route = useRoute()
  const canGoBack = navigation.canGoBack()
  // 🔍 현재 route.name과 일치하는 title 찾기
  const matchedRoute = authRoutes()
    .flatMap(group => group.children)
    .find(r => r.name === route.name)

  const title = matchedRoute?.title ?? route.name

  return (
    <Appbar.Header>
      {canGoBack && <Appbar.BackAction onPress={() => navigation.goBack()} />}
      <Appbar.Content title={title} />                
    </Appbar.Header>
  )
}
