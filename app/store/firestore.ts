import {getApp} from '@react-native-firebase/app'
import {getFirestore} from '@react-native-firebase/firestore'

// firebase.ts
export const firestore = getFirestore(getApp())
