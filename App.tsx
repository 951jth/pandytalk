/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
//  * @format
 */

import {NavigationContainer} from '@react-navigation/native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import React from 'react'
import {PaperProvider} from 'react-native-paper'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {Provider} from 'react-redux'
import {navigationRef} from './app/components/navigation/RootNavigation'
import theme from './app/constants/theme'
import store from './app/store/store'
import {RootNavigator} from './RootNavigator'

const queryClient = new QueryClient()

function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={theme}>
          <SafeAreaProvider>
            <NavigationContainer ref={navigationRef}>
              <RootNavigator />
            </NavigationContainer>
          </SafeAreaProvider>
        </PaperProvider>
      </QueryClientProvider>
    </Provider>
  )
}

export default App
