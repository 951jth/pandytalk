import {getApp} from '@react-native-firebase/app'
import {getAuth} from '@react-native-firebase/auth'
import {getFirestore} from '@react-native-firebase/firestore'
import {getMessaging} from '@react-native-firebase/messaging'

// firebase.ts
export const app = getApp()
export const auth = getAuth()
export const firestore = getFirestore(app)
export const messaging = getMessaging(app)
