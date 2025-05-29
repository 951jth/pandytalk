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
import {View} from 'react-native'
import {ActivityIndicator} from 'react-native-paper'
import AuthNavigator from './app/navigation/AuthNavigator'
import NoAuthNavigator from './app/navigation/NoAuthNavigator'
import {fetchUserById} from './app/store/userSlice'
const authInstance = getAuth()

export function MainApp(): React.JSX.Element {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null)
  const [initializing, setInitializing] = useState<boolean>(true)
  //   const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    const subscriber = onAuthStateChanged(authInstance, userInfo => {
      setUser(userInfo)

      const fetchUser = async () => {
        if (userInfo?.uid) {
          try {
            await dispatchEvent(fetchUserById(userInfo.uid)).unwrap()
          } catch (err) {
            console.error('❌ 유저 정보 로딩 실패:', err)
            setUser(null)
          }
        } else {
          setUser(null)
        }
      }
      if (initializing) setInitializing(false)

      //   fetchUser()
    })

    return subscriber
  }, [])

  if (initializing) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator />
      </View>
    )
  } // 초기 로딩 중에는 화면 렌더 안 함

  return (
    <NavigationContainer>
      {user ? <AuthNavigator /> : <NoAuthNavigator />}
    </NavigationContainer>
  )
}
