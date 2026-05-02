import {getApp} from '@react-native-firebase/app'
import {getAuth} from '@react-native-firebase/auth'
import {getCrashlytics} from '@react-native-firebase/crashlytics'
import {getFirestore} from '@react-native-firebase/firestore'
import {getMessaging} from '@react-native-firebase/messaging'
import {getRemoteConfig} from '@react-native-firebase/remote-config'
import {getStorage} from '@react-native-firebase/storage'

// firebase.ts
export const app = getApp()
export const auth = getAuth()
export const crashlytics = getCrashlytics()
export const firestore = getFirestore(app)
export const messaging = getMessaging(app)
export const remoteConfig = getRemoteConfig(app)
export const storage = getStorage(app)
