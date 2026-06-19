/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 */

import {useRootAppSetup} from '@app/bootstrap/useRootAppSetup'
import COLORS from '@app/shared/constants/color'
import type {RootStackParamList} from '@app/shared/types/navigate'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import React from 'react'
import {StatusBar} from 'react-native'
import PandySplashScreen from './app/features/app/screens/PandySplashScreen'
import AppNavigator from './app/navigation/AppNavigator'
import AuthNavigator from './app/navigation/AuthNavigator'

const RootStack = createNativeStackNavigator<RootStackParamList>()

export function RootNavigator() {
  //이 파일에는 네비게이션 관련 스크린만 보게해야함.
  const {shouldShowSplash, canEnterApp} = useRootAppSetup()

  // 초기 필수 준비 중 스플래시
  if (shouldShowSplash) {
    return <PandySplashScreen />
  }

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
