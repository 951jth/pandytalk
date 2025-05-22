/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
//  * @format
 */

import React, {useEffect, useState} from 'react'

import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth'
import {NavigationContainer} from '@react-navigation/native'
import {PaperProvider} from 'react-native-paper'
import theme from './app/constants/theme'
import AuthNavigator from './app/navigation/AuthNavigator'
import NoAuthNavigator from './app/navigation/NoAuthNavigator'
import {initFirebase} from './app/services/firebase'

function App(): React.JSX.Element {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null)
  const [initializing, setInitializing] = useState<boolean>(true)

  useEffect(() => {
    initFirebase()

    const subscriber = auth().onAuthStateChanged(userInfo => {
      setUser(userInfo)
      if (initializing) setInitializing(false)
    })

    return subscriber // unsubscribe on unmount
  }, [])

  return (
    <NavigationContainer>
      <PaperProvider theme={theme}>
        {user ? <AuthNavigator /> : <NoAuthNavigator />}
      </PaperProvider>
    </NavigationContainer>
  )
}

export default App
