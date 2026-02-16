import {tabScreens} from '@app/navigation/tabScreens'
import {appRoutes} from '@app/navigation/useScreens'
import COLORS from '@app/shared/constants/color'
import {useLogout} from '@app/shared/hooks/useLogout'
import {useNavigation, useNavigationState} from '@react-navigation/native'
import type {NativeStackNavigationProp} from '@react-navigation/native-stack'
import React, {ReactNode} from 'react'
import {StyleSheet, View} from 'react-native'
import {IconButton, Text} from 'react-native-paper'
import type {RootStackParamList} from '../shared/types/navigate'

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
  const tabs = tabScreens()
  const {confirmLogout} = useLogout()

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
            onPress={confirmLogout}
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
    borderBottomColor: COLORS.gray,
    height: 50,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3, // Android 그림자
    backgroundColor: COLORS.deepGray,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 17,
    fontFamily: 'BMDOHYEON',
    flex: 1,
    padding: 8,
    color: COLORS.text,
  },
  rightActions: {},
})
