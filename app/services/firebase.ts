// app/services/firebase.ts
import {firebase} from '@react-native-firebase/auth'

export const initFirebase = () => {
  if (!firebase.apps.length) {
    firebase.app()
  }
}
