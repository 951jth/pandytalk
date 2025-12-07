import {useNavigation, useNavigationState} from '@react-navigation/native'
import type {NativeStackNavigationProp} from '@react-navigation/native-stack'
import React, {ReactNode} from 'react'
import {StyleSheet, View} from 'react-native'
import {IconButton, Text} from 'react-native-paper'
import {useDispatch} from 'react-redux'
import {appRoutes, tabScreens} from '../../features/app/hooks/useScreens'
import {updateUserOffline} from '../../services/userService'
import {useAppSelector} from '../../store/reduxHooks'
import type {AppDispatch} from '../../store/store'
import {logout} from '../../store/userSlice'
import type {RootStackParamList} from '../../types/navigate'

interface propTypes {
  title?: string
  rightActions?: ReactNode[]
}

export default function AppHeader({title, rightActions = []}: propTypes) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const canGoBack = navigation.canGoBack()
  const allRoutes =
    appRoutes()?.flatMap(layoutGroup => layoutGroup?.children) || []
  const {data: user, loading, error} = useAppSelector(state => state.user)
  // const tabs = useMemo(() => tabScreens(), [user?.authority ?? null]) // 동적일 수도 있음

  const tabs = tabScreens()
  const dispatch = useDispatch<AppDispatch>()
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
      user?.uid && (await updateUserOffline(user.uid))
      // navigation.navigate('auth', {screen: 'login'})
      await logout(dispatch)
      // 필요시 로그인 화면으로 리디렉션
    } catch (e) {
      console.log('로그아웃 실패:', e)
    }
  }

  return (
    <View style={styles.header}>
      {canGoBack && (
        <IconButton
          onPress={() => navigation.goBack()}
          icon={'arrow-left'}
          style={{margin: 0}}
        />
      )}
      <Text style={styles.title}>{title ?? currentTitle}</Text>
      <View style={styles.rightActions}>
        {rightActions?.map((node: React.ReactNode) => node)}
        {!canGoBack && (
          <IconButton
            icon="logout"
            onPress={handleLogout}
            style={{margin: -12}}
          />
        )}
      </View>
    </View>
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
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  title: {fontSize: 18, fontFamily: 'BMDOHYEON', flex: 1, padding: 8},
  rightActions: {},
})
