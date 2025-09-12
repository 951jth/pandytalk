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
import AppNavigator from './app/navigation/AppNavigator'
import AuthNavigator from './app/navigation/AuthNavigator'

import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {Alert, AppState, StatusBar, View} from 'react-native'
import {ActivityIndicator} from 'react-native-paper'
import {useDispatch} from 'react-redux'
import {navigationRef} from './app/components/navigation/RootNavigation'
import {useFCMListener, useFCMSetup} from './app/hooks/useFCM'
import {useFCMPushHandler} from './app/hooks/useFCMPush'
import {initialRouteName} from './app/hooks/useScreens'
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
  const [navReady, setNavReady] = useState(false)
  const {data: userInfo, loading, error} = useAppSelector(state => state.user)

  const dispatch = useDispatch<AppDispatch>()
  useFCMSetup() //FCM 푸시알림 세팅
  useFCMListener(user?.uid) //FCM -> 채팅방 목록 갱신
  useFCMPushHandler() //푸쉬알림 -> 채팅방 이동 핸들링

  useEffect(() => {
    if (navigationRef.isReady()) {
      setNavReady(true) // ✅ 네비 준비됨
    }
  }, [navigationRef.current]) // ref.current 감지는 제한적이므로 아래 onReady 병행 권장

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
      // user?.uid && (await updateUserOffline(user.uid))
      console.log('❌ 유저 정보 로딩 실패:', err)
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
    isMessagesTableExists().then(exists => {
      if (!exists) {
        console.log('messages 테이블이 없어 초기화 시작')
        initChatTables()
      } else {
        console.log('이미 messages 테이블 있음')
      }
    })
    // initTimeOffset()
  }, [])

  //앱 초기 마운트시 경로 지정
  useEffect(() => {
    console.log('userInfo', userInfo)
    if (!navReady) return
    ;(async () => {
      if (!navigationRef.isReady()) return
      navigationRef.reset({
        index: 0,
        routes: [
          userInfo?.accountStatus == 'confirm'
            ? {name: 'app', params: {screen: initialRouteName}}
            : {name: 'auth', params: {screen: 'login'}},
        ],
      })
    })()
    //앱이 백그라운드 → 포그라운드로 돌아올 때 lastSeen을 갱신
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (userInfo?.accountStatus !== 'confirm') return

      if (nextAppState === 'active' && user?.uid) {
        updateLastSeen(user.uid)
      }
      if (nextAppState === 'background' && user?.uid) {
        updateUserOffline(user.uid)
      }
    })
    return () => subscription.remove()
  }, [userInfo, navReady])

  if (initializing) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator />
      </View>
    )
  } // 초기 로딩 중에는 화면 렌더 안 함

  return (
    <>
      <StatusBar
        translucent={false}
        backgroundColor="#FFF" // Android 배경
        barStyle={'dark-content'}
      />
      <RootStack.Navigator>
        <RootStack.Screen
          name="app"
          component={AppNavigator}
          options={{headerShown: false}}
        />
        <RootStack.Screen
          name="auth"
          component={AuthNavigator}
          options={{headerShown: false}}
        />
      </RootStack.Navigator>
    </>
  )
}
