/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 */

import {useRootAppSetup} from '@app/bootstrap/useRootAppSetup'
import type {RootStackParamList} from '@app/shared/types/navigate'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import React from 'react'
import {StatusBar} from 'react-native'
import PandySplashScreen from './app/features/app/screens/PandySplashScreen'
import AppNavigator from './app/navigation/AppNavigator'
import AuthNavigator from './app/navigation/AuthNavigator'

const RootStack = createNativeStackNavigator<RootStackParamList>()

export function RootNavigator() {
  const {shouldShowSplash, canEnterApp} = useRootAppSetup()
  // 초기/프로필 로딩 중 스플래시
  if (shouldShowSplash) {
    return <PandySplashScreen />
  }

  return (
    <>
      <StatusBar
        translucent={false}
        backgroundColor="#FFF"
        barStyle="dark-content"
      />
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
