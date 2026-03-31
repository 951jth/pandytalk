/**
 * @format
 */
import {AppRegistry} from 'react-native'
import App from './App'
import {name as appName} from './app.json'
import {getApp} from '@react-native-firebase/app'
import {
  getMessaging,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging'

// Firebase Background Handler
const app = getApp()
const messaging = getMessaging(app)

setBackgroundMessageHandler(messaging, async remoteMessage => {
  console.log('📥 Background message received:', remoteMessage)
  // 필요한 백그라운드 처리 수행
})

// 앱 메인 컴포넌트 등록
AppRegistry.registerComponent(appName, () => App)
