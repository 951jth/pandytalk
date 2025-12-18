import {auth} from '@app/shared/firebase/firestore'
import {signInWithEmailAndPassword} from '@react-native-firebase/auth'

export default {
  authLogin: async (email: string, password: string) => {
    try {
      // const {email, password} = formValues
      if (!email || !password) return
      signInWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      return error
    }
  },
}
