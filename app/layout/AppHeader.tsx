import {tabScreens} from '@app/navigation/tabScreens'
import {appRoutes} from '@app/navigation/useScreens'
import COLORS from '@app/shared/constants/color'
import {useLogout} from '@app/shared/hooks/useLogout'
import {useNavigation, useNavigationState} from '@react-navigation/native'
import type {NativeStackNavigationProp} from '@react-navigation/native-stack'
import React, {ReactNode} from 'react'
import {StyleProp, StyleSheet, TextStyle, View, ViewStyle} from 'react-native'
import {IconButton, Text} from 'react-native-paper'
import type {RootStackParamList} from '../shared/types/navigate'

interface propTypes {
  title?: string
  rightActions?: ReactNode[]
  style?: StyleProp<ViewStyle>
  titleStyle?: StyleProp<TextStyle>
  titleAlign?: 'left' | 'center' | 'right'
}

export default function AppHeader({
  title,
  rightActions = [],
  style,
  titleStyle,
  titleAlign = 'center',
}: propTypes) {
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
    <View style={[styles.header, style]}>
      <View style={styles.leftSection}>
        {canGoBack && (
          <IconButton
            onPress={() => navigation.goBack()}
            icon={'keyboard-backspace'} // 더 모던한 아이콘으로 변경
            size={24}
            iconColor="#2D2D2D"
            style={styles.backBtn}
          />
        )}
      </View>

      <Text
        style={[styles.title, {textAlign: titleAlign}, titleStyle]}
        numberOfLines={1}>
        {title ?? currentTitle}
      </Text>

      <View style={styles.rightSection}>
        <View style={styles.rightActions}>
          {rightActions?.map((node: React.ReactNode) => node)}
          {!canGoBack && (
            <IconButton
              icon="logout-variant"
              size={22}
              iconColor={COLORS.primary}
              onPress={confirmLogout}
              style={styles.logoutBtn}
            />
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    height: 50,
    backgroundColor: COLORS.background,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    // 더 가벼워진 소프트 섀도우
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1.5},
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
    zIndex: 100,
  },
  leftSection: {
    width: 48,
    alignItems: 'flex-start',
  },
  rightSection: {
    width: 48,
    alignItems: 'flex-end',
  },
  backBtn: {
    margin: 0,
  },
  title: {
    fontSize: 18, // 18 -> 20 (Polished Size)
    fontFamily: 'BMDOHYEON',
    flex: 1,
    color: '#2D2D2D', // 선명한 딥 차콜
    textAlign: 'center', // 프리미엄 룩을 위한 중앙 정렬
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutBtn: {
    margin: 0,
  },
})
