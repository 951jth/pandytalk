import {firebaseCall} from '@app/shared/firebase/firebaseCall'
import {auth} from '@app/shared/firebase/firestore'
import {
  createUserWithEmailAndPassword,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
} from '@react-native-firebase/auth'

export const authRemote = {
  signIn: (email: string, password: string) => {
    return firebaseCall('authRemote.signIn', () =>
      signInWithEmailAndPassword(auth, email, password),
    )
  },
  signOut: () => {
    return firebaseCall('autoRemote.signOut', () => signOut(auth))
  },
  createUserAuth: (email: string, password: string) => {
    return firebaseCall('authRemote.signUp', () =>
      createUserWithEmailAndPassword(auth, email, password),
    )
  },
  getAnonymouslyToken: () => {
    return firebaseCall('authRemote.Anonymously', () => signInAnonymously(auth))
  },
}
