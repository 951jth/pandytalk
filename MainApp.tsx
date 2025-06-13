/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
//  * @format
 */

import React, {useEffect, useState} from 'react'

import {
  FirebaseAuthTypes,
  getAuth,
  onAuthStateChanged,
} from '@react-native-firebase/auth'
import {NavigationContainer} from '@react-navigation/native'
import {AppState, StatusBar, View} from 'react-native'
import {ActivityIndicator} from 'react-native-paper'
import {useDispatch} from 'react-redux'
import {navigationRef} from './app/components/navigation/RootNavigation'
import {useFCMSetup} from './app/hooks/useFCM'
import AuthNavigator from './app/navigation/AuthNavigator'
import NoAuthNavigator from './app/navigation/NoAuthNavigator'
import {updateLastSeen, updateUserOffline} from './app/services/userService'
import {AppDispatch} from './app/store/store'
import {clearUser, fetchUserById} from './app/store/userSlice'

const authInstance = getAuth()

export function MainApp(): React.JSX.Element {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null)
  const [initializing, setInitializing] = useState<boolean>(true)
  const dispatch = useDispatch<AppDispatch>()
  useFCMSetup() //FCM 푸시알림 세팅

  const fetchProfile = async (uid: string) => {
    try {
      const profile = await dispatch(fetchUserById(uid)).unwrap()
      await updateLastSeen(uid)
    } catch (err: any) {
      console.error('❌ 유저 정보 로딩 실패:', err)
    }
  }

  useEffect(() => {
    const subscriber = onAuthStateChanged(authInstance, userInfo => {
      setUser(userInfo)
      if (userInfo?.uid) {
        fetchProfile(userInfo?.uid)
      } else {
        dispatch(clearUser()) // 로그아웃 or 비인증
      }
      if (initializing) setInitializing(false)
    })

    return subscriber // unsubscribe on unmount
  }, [dispatch])

  useEffect(() => {
    //앱이 백그라운드 → 포그라운드로 돌아올 때 lastSeen을 갱신
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active' && user?.uid) {
        updateLastSeen(user.uid)
      }
      if (nextAppState === 'background' && user?.uid) {
        updateUserOffline(user.uid)
      }
    })
    return () => subscription.remove()
  }, [user])

  if (initializing) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator />
      </View>
    )
  } // 초기 로딩 중에는 화면 렌더 안 함

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar
        translucent={true}
        // translucent={false}
        backgroundColor="#FFF" // Android 배경
        barStyle={'dark-content'}
      />

      {user ? <AuthNavigator /> : <NoAuthNavigator />}
    </NavigationContainer>
  )
}
