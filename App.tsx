/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
//  * @format
 */

import React, {useEffect, useMemo, useState} from 'react'

import {
  FirebaseAuthTypes,
  getAuth,
  onAuthStateChanged,
} from '@react-native-firebase/auth'
import {NavigationContainer} from '@react-navigation/native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {View} from 'react-native'
import {ActivityIndicator, PaperProvider} from 'react-native-paper'
import theme from './app/constants/theme'
import AuthNavigator from './app/navigation/AuthNavigator'
import NoAuthNavigator from './app/navigation/NoAuthNavigator'
const authInstance = getAuth()

function App(): React.JSX.Element {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null)
  const [initializing, setInitializing] = useState<boolean>(true)
  const queryClient = useMemo(() => new QueryClient(), [])

  useEffect(() => {
    const subscriber = onAuthStateChanged(authInstance, async userInfo => {
      setUser(userInfo)
      if (userInfo) {
        try {
        } catch (err) {
          console.error('❌ Failed to fetch profile:', err)
        }
      }
      if (initializing) setInitializing(false)
    })

    return subscriber // unsubscribe on unmount
  }, [])
  if (initializing) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator />
      </View>
    )
  } // 초기 로딩 중에는 화면 렌더 안 함

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <PaperProvider theme={theme}>
          {user ? <AuthNavigator /> : <NoAuthNavigator />}
        </PaperProvider>
      </NavigationContainer>
    </QueryClientProvider>
  )
}

export default App
