/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
//  * @format
 */

import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import React from 'react'
import {RecoilRoot} from 'recoil'
import MainApp from './MainApp'

const queryClient = new QueryClient()

function App(): React.JSX.Element {
  return (
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <MainApp />
      </QueryClientProvider>
    </RecoilRoot>
  )
}

export default App
