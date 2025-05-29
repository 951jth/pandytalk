/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
//  * @format
 */

import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import React from 'react'
import {PaperProvider} from 'react-native-paper'
import {Provider} from 'react-redux'
import theme from './app/constants/theme'
import store from './app/store/store'
import {MainApp} from './MainApp'

const queryClient = new QueryClient()

function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={theme}>
          <MainApp />
        </PaperProvider>
      </QueryClientProvider>
    </Provider>
  )
}

export default App
