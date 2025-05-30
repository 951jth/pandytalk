import {getAuth, signOut} from '@react-native-firebase/auth'
import {useNavigation, useNavigationState} from '@react-navigation/native'
import React from 'react'
import {StyleSheet} from 'react-native'
import {Appbar} from 'react-native-paper'
import {authRoutes, tabScreens} from '../../hooks/useRoutes'
import {clearUser} from '../../store/userSlice'
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
      clearUser()
      // 필요시 로그인 화면으로 리디렉션
    } catch (e) {
      console.log('로그아웃 실패:', e)
    }
  }

  return (
    <Appbar.Header style={styles.header} mode="small">
      {canGoBack && <Appbar.BackAction onPress={() => navigation.goBack()} />}
      <Appbar.Content title={currentTitle} titleStyle={styles.title} />
      <Appbar.Action icon="logout" onPress={handleLogout} size={20} />
    </Appbar.Header>
  )
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#d9d9d9',
    height: 50,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3, // Android 그림자
    backgroundColor: 'unset',
  },
  title: {fontSize: 20},
})
