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
import {PaperProvider} from 'react-native-paper'
import {useSetRecoilState} from 'recoil'
import theme from './app/constants/theme'
import AuthNavigator from './app/navigation/AuthNavigator'
import NoAuthNavigator from './app/navigation/NoAuthNavigator'
import {fetchUserProfile} from './app/services/userService'
import {userState} from './app/store/userStore'
const authInstance = getAuth()

function MainApp(): React.JSX.Element {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null)
  const [initializing, setInitializing] = useState<boolean>(true)
  const setUserProfile = useSetRecoilState(userState)

  useEffect(() => {
    const subscriber = onAuthStateChanged(authInstance, async userInfo => {
      setUser(userInfo)
      if (userInfo) {
        try {
          const userProfile = await fetchUserProfile(userInfo.uid)
          setUserProfile(userProfile)
        } catch (err) {
          console.error('❌ Failed to fetch profile:', err)
        }
      }
      if (initializing) setInitializing(false)
    })

    return subscriber // unsubscribe on unmount
  }, [])
  if (initializing) return <></> // 초기 로딩 중에는 화면 렌더 안 함

  return (
    <NavigationContainer>
      <PaperProvider theme={theme}>
        {user ? <AuthNavigator /> : <NoAuthNavigator />}
      </PaperProvider>
    </NavigationContainer>
  )
}

export default MainApp
