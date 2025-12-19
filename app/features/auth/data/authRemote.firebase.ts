import {submitSignupRequest} from '@app/services/authService'
import {removeFCMTokenOnLogout} from '@app/services/userService'
import {auth} from '@app/shared/firebase/firestore'
import {UserJoinRequest} from '@app/shared/types/auth'
import {firebaseCall} from '@app/shared/utils/logger'
import {
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
  signUp: (payload: UserJoinRequest) => {
    return firebaseCall('authRemote.signUp', () => submitSignupRequest(payload))
  },
  getAnonymouslyToken: () => {
    return firebaseCall('authRemote.Anonymously', () => signInAnonymously(auth))
  },
  removeFCMToken: () => {
    return firebaseCall('authRemote.removeFCMToken', () =>
      removeFCMTokenOnLogout(),
    )
  },
}
