/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 */

import {useRootAppSetup} from '@app/bootstrap/useRootAppSetup'
import COLORS from '@app/shared/constants/color'
import {analytics} from '@app/shared/services/analytics'
import type {RootStackParamList} from '@app/shared/types/navigate'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import React, {useEffect, useRef} from 'react'
import {StatusBar} from 'react-native'
import PandySplashScreen from './app/features/app/screens/PandySplashScreen'
import AppNavigator from './app/navigation/AppNavigator'
import AuthNavigator from './app/navigation/AuthNavigator'

const RootStack = createNativeStackNavigator<RootStackParamList>()

export function RootNavigator() {
  //이 파일에는 네비게이션 관련 스크린만 보게해야함.
  const {shouldShowSplash, canEnterApp} = useRootAppSetup()
  const lastResolvedTarget = useRef<string | null>(null)
  const target = shouldShowSplash ? 'splash' : canEnterApp ? 'app' : 'auth'

  useEffect(() => {
    if (lastResolvedTarget.current === target) return

    lastResolvedTarget.current = target
    analytics.track('root_navigator_resolved', {
      target,
      shouldShowSplash,
      canEnterApp,
    })
  }, [canEnterApp, shouldShowSplash, target])

  // 초기/프로필 로딩 중 스플래시
  if (shouldShowSplash) {
    return <PandySplashScreen />
  }
  console.log('shouldShowSplash', shouldShowSplash)
  console.log('canEnterApp', canEnterApp)

  return (
    <>
      <StatusBar backgroundColor={COLORS.background} barStyle="dark-content" />

      <RootStack.Navigator screenOptions={{headerShown: false}}>
        {canEnterApp ? (
          <RootStack.Screen name="app" component={AppNavigator} />
        ) : (
          <RootStack.Screen name="auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </>
  )
}
