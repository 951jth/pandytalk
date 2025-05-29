import {getAuth, signOut} from '@react-native-firebase/auth'
import {useNavigation, useNavigationState} from '@react-navigation/native'
import React from 'react'
import {StyleSheet} from 'react-native'
import * as Paper from 'react-native-paper'
import {authRoutes, tabScreens} from '../../hooks/useRoutes'
const authInstance = getAuth()

export default function AppBar() {
  const navigation = useNavigation()
  const canGoBack = navigation.canGoBack()
  const allRoutes =
    authRoutes()?.flatMap(layoutGroup => layoutGroup?.children) || []
  const tabs = tabScreens() // 동적일 수도 있음

  const currentTitle = useNavigationState(state => {
    const current = state.routes[state.index]
    // 1. 현재 route가 'main'이면 (즉, 탭 화면의 title)
    if (current.name === 'main' && current.state) {
      const tabState = current.state
      const activeTabIndex = tabState.index ?? 0
      const tabRoute = tabState.routes[activeTabIndex]

      const matched = tabs.find(t => `${t.name}` === tabRoute.name)
      return matched?.title ?? tabRoute.name
    }
    // 2. 그 외 route는 title 그대로 사용
    const matchedRoute = allRoutes.find(r => r.name === current.name)
    return matchedRoute?.title ?? current.name
  })

  const handleLogout = async () => {
    try {
      await signOut(authInstance)
      // 필요시 로그인 화면으로 리디렉션
    } catch (e) {
      console.log('로그아웃 실패:', e)
    }
  }

  // useEffect(() => {
  //   const matched = mainRoutes.find(r => `${r.name}Tab` === currentRouteName)
  //   setTitle(matched?.title || currentRoute)
  // }, [currentRoute])

  return (
    <Paper.Appbar.Header style={styles.header}>
      {canGoBack && (
        <Paper.Appbar.BackAction onPress={() => navigation.goBack()} />
      )}
      <Paper.Appbar.Content title={currentTitle} />
      <Paper.Appbar.Action icon="logout" onPress={handleLogout} />
    </Paper.Appbar.Header>
  )
}

const styles = StyleSheet.create({
  header: {borderBottomWidth: 1, borderBottomColor: '#d9d9d9'},
})
