import {getApp} from '@react-native-firebase/app'
import {getAuth} from '@react-native-firebase/auth'
import {getFirestore} from '@react-native-firebase/firestore'

export const app = getApp()
export const auth = getAuth()
// firebase.ts
export const firestore = getFirestore(app)
