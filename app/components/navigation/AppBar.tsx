import {getAuth, signOut} from '@react-native-firebase/auth'
import {useNavigation, useNavigationState} from '@react-navigation/native'
import React, {useEffect, useState} from 'react'
import {StyleSheet} from 'react-native'
import {Appbar} from 'react-native-paper'
import {authRoutes} from '../../hooks/useRoutes'
const authInstance = getAuth()

export default function AppBar() {
  const navigation = useNavigation()
  const canGoBack = navigation.canGoBack()
  const [title, setTitle] = useState<string | null>('Users')
  const mainRoutes = authRoutes()?.[0]?.children || []

  //현재 route name
  const currentRouteName = useNavigationState(state => {
    const nested = state.routes?.[state.index]?.state
    const tab = nested?.routes?.[nested?.index || 0]
    return tab?.name ?? 'Users'
  })

  const handleLogout = async () => {
    try {
      await signOut(authInstance)
      // 필요시 로그인 화면으로 리디렉션
    } catch (e) {
      console.log('로그아웃 실패:', e)
    }
  }

  useEffect(() => {
    const matched = mainRoutes.find(r => `${r.name}Tab` === currentRouteName)
    setTitle(matched?.title || currentRouteName)
  }, [currentRouteName])

  return (
    <Appbar.Header style={styles.header}>
      {canGoBack && <Appbar.BackAction onPress={() => navigation.goBack()} />}
      <Appbar.Content title={title} />
      <Appbar.Action icon="logout" onPress={handleLogout} />
    </Appbar.Header>
  )
}

const styles = StyleSheet.create({
  header: {borderBottomWidth: 1, borderBottomColor: '#d9d9d9'},
})
