/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 */

import {
  FirebaseAuthTypes,
  getAuth,
  onAuthStateChanged,
} from '@react-native-firebase/auth'
import React, {useEffect, useState} from 'react'
import AppNavigator from './app/navigation/AppNavigator'
import AuthNavigator from './app/navigation/AuthNavigator'

import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {Alert, AppState, StatusBar, View} from 'react-native'
import {ActivityIndicator} from 'react-native-paper'
import {useDispatch} from 'react-redux'
// reset 제거 → navigationRef 불필요
// import {navigationRef} from './app/components/navigation/RootNavigation'
import {useFCMSetup} from './app/hooks/useFCM'
import {useFCMPushHandler} from './app/hooks/useFCMPush'
// import {initialRouteName} from './app/hooks/useScreens'
import {initChatTables, isMessagesTableExists} from './app/services/chatService'
import {updateLastSeen, updateUserOffline} from './app/services/userService'
import {useAppSelector} from './app/store/reduxHooks'
import {AppDispatch} from './app/store/store'
import {clearUser, fetchUserById, logout} from './app/store/userSlice'
import {RootStackParamList} from './app/types/navigate'

const authInstance = getAuth()
const RootStack = createNativeStackNavigator<RootStackParamList>()

export function RootNavigator(): React.JSX.Element {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null)
  const [initializing, setInitializing] = useState<boolean>(true)
  const {data: userInfo, loading} = useAppSelector(state => state.user)

  const dispatch = useDispatch<AppDispatch>()
  useFCMSetup() // FCM 푸시알림 세팅
  // useFCMListener(user?.uid) // FCM -> 채팅방 목록 갱신
  useFCMPushHandler() // 푸쉬알림 -> 채팅방 이동 핸들링

  const fetchProfile = async (uid: string) => {
    try {
      const profile = await dispatch(fetchUserById(uid)).unwrap()
      if (profile?.accountStatus !== 'confirm') {
        Alert.alert(
          '승인 대기 중',
          '회원님의 게스트 신청이 아직 승인되지 않았습니다.\n관리자가 확인 후 승인이 완료되면 다시 이용하실 수 있습니다.',
        )
        user?.uid && (await updateUserOffline(user.uid))
        await logout(dispatch)
      } else {
        await updateLastSeen(uid)
      }
    } catch (err: any) {
      console.log('❌ 유저 정보 로딩 실패:', err)
    }
  }

  // FB Auth 상태 감시
  useEffect(() => {
    const subscriber = onAuthStateChanged(authInstance, fbUser => {
      setUser(fbUser)
      if (fbUser?.uid) {
        fetchProfile(fbUser.uid)
      } else {
        dispatch(clearUser()) // 로그아웃 or 비인증
      }
      if (initializing) setInitializing(false)
    })
    return subscriber
  }, [dispatch])

  // 로컬 DB 테이블 준비 (그대로 유지)
  useEffect(() => {
    isMessagesTableExists().then(exists => {
      if (!exists) {
        console.log('messages 테이블이 없어 초기화 시작')
        initChatTables()
      } else {
        console.log('이미 messages 테이블 있음')
      }
    })
  }, [])

  // AppState에 따른 lastSeen/오프라인 처리 (그대로 유지하되 분리)
  useEffect(() => {
    if (userInfo?.accountStatus !== 'confirm' || !user?.uid) return
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') updateLastSeen(user.uid)
      if (nextAppState === 'background') updateUserOffline(user.uid)
    })
    return () => subscription.remove()
  }, [userInfo?.accountStatus, user?.uid])

  const shouldShowSplash = initializing || (loading && !userInfo)

  // 초기/프로필 로딩 중 스플래시
  if (shouldShowSplash) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator />
      </View>
    )
  }

  // ✅ 선언적 Auth Gate: reset 없이 스크린 전환
  const isConfirmed = !!user && userInfo?.accountStatus === 'confirm'

  return (
    <>
      <StatusBar
        translucent={false}
        backgroundColor="#FFF"
        barStyle="dark-content"
      />
      <RootStack.Navigator screenOptions={{headerShown: false}}>
        {isConfirmed ? (
          <RootStack.Screen name="app" component={AppNavigator} />
        ) : (
          <RootStack.Screen name="auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </>
  )
}
