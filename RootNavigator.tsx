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

import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {Alert, AppState, InteractionManager, StatusBar} from 'react-native'
import {useDispatch} from 'react-redux'
// reset 제거 → navigationRef 불필요
// import {navigationRef} from './app/components/navigation/RootNavigation'
import {safeCall} from '@utils/call'
import {throttle} from 'lodash'
import {initChatTables, isMessagesTableExists} from './app/db/sqlite'
import {useFCMSetup} from './app/hooks/useFCM'
import {useFCMPushHandler} from './app/hooks/useFCMPush'
import AppNavigator from './app/navigation/AppNavigator'
import AuthNavigator from './app/navigation/AuthNavigator'
import PandySplashScreen from './app/screens/PandySplashScreen'
import {migrateDatabaseIfNeeded} from './app/services/migrationService'
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

  const onActive = throttle((uid: string) => {
    safeCall(() => updateLastSeen(uid))
  }, 1000)

  const onBg = throttle((uid: string) => {
    safeCall(() => updateUserOffline(uid))
  }, 1000)

  useFCMPushHandler() // 푸쉬알림 -> 채팅방 이동 핸들링

  const fetchProfile = async (uid: string) => {
    try {
      const profile = await dispatch(fetchUserById(uid)).unwrap()
      if (profile?.accountStatus !== 'confirm') {
        Alert.alert(
          '승인 대기 중',
          '회원님의 가입 신청이 아직 승인되지 않았습니다.\n관리자가 확인 후 승인이 완료되면 다시 이용하실 수 있습니다.',
        )
        // 1) 즉시 네트워크 쓰기/로그아웃 금지 → 충돌/중첩 방지
        InteractionManager.runAfterInteractions(() => {
          Promise.resolve()
            .then(() => (user?.uid ? updateUserOffline(user.uid) : undefined))
            .then(() => logout(dispatch))
            .catch(e => console.warn('[logout flow]', e))
        })
      } else {
        // 승인된 경우도 실패흡수
        try {
          await updateLastSeen(uid)
        } catch (e) {
          console.warn(e)
        }
      }
    } catch (err) {
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
    // 좋은 질문이에요 — InteractionManager.runAfterInteractions는 React Native에서 “UI가 완전히 안정된 이후에 실행할 콜백”을 예약하는 도구입니다.
    // 즉, **화면 렌더링/애니메이션/제스처 같은 상호작용(interactions)**이 모두 끝난 뒤에 비동기 로직을 실행시킵니다.
    const task = InteractionManager.runAfterInteractions(async () => {
      try {
        const exists = await isMessagesTableExists()
        console.log(exists)
        if (!exists) {
          initChatTables()
        } else migrateDatabaseIfNeeded()
      } catch (e) {
        console.warn('[sqlite init]', e) // 크래시 방지
      }
    })

    return () => task.cancel()
  }, [])

  useEffect(() => {
    if (userInfo?.accountStatus !== 'confirm' || !user?.uid) return
    let prev = AppState.currentState
    // AppState 이벤트는 inactive→active처럼 연달아 여러 번 들어올 수 있어서, 스로틀링 적용
    const sub = AppState.addEventListener('change', next => {
      if (next === 'active' && prev !== 'active') onActive(user.uid)
      if (next === 'background' && prev !== 'background') onBg(user.uid)
      prev = next
    })
    return () => sub.remove()
  }, [userInfo?.accountStatus, user?.uid])

  const shouldShowSplash = initializing || (loading && !userInfo)

  // 초기/프로필 로딩 중 스플래시
  if (shouldShowSplash) {
    return <PandySplashScreen />
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
