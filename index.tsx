/**
 * @format
 */

import {getApp} from '@react-native-firebase/app'
import {
  getMessaging,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging'
import {AppRegistry} from 'react-native'
import App from './App'
import {name as appName} from './app.json'

const app = getApp()
const messaging = getMessaging(app)

setBackgroundMessageHandler(messaging, async remoteMessage => {
  console.log('📥 Background message received:', remoteMessage)
  // 필요한 백그라운드 처리
})

AppRegistry.registerComponent(appName, () => App)
