/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 */

import theme from '@app/shared/constants/theme'
import {NavigationContainer} from '@react-navigation/native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import React from 'react'
import {PaperProvider} from 'react-native-paper'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {Provider} from 'react-redux'
import {navigationRef, onNavReady} from './app/navigation/RootNavigation'
import store from './app/store/store'
import {RootNavigator} from './RootNavigator'

const queryClient = new QueryClient()

function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={theme}>
          <SafeAreaProvider>
            <NavigationContainer ref={navigationRef} onReady={onNavReady}>
              <RootNavigator />
            </NavigationContainer>
          </SafeAreaProvider>
        </PaperProvider>
      </QueryClientProvider>
    </Provider>
  )
}

export default App
