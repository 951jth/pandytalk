/**
 * @format
 */
import {AppRegistry} from 'react-native'
import App from './App' // 또는 './src/App' 위치에 맞게
import {expo} from './app.json'
const appName = expo.name

// 🔔 FCM background handler도 여기로 옮겨도 되고
import {getApp} from '@react-native-firebase/app'
import {
  getMessaging,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging'

const app = getApp()
const messaging = getMessaging(app)

setBackgroundMessageHandler(messaging, async remoteMessage => {
  console.log('📥 Background message received:', remoteMessage)
})

AppRegistry.registerComponent(appName, () => App)
