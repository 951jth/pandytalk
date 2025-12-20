import {firestore} from '@app/shared/firebase/firestore'
import {type User, type UserJoinRequest} from '@app/shared/types/auth'
import {UpdateInput} from '@app/shared/types/firebase'
import {firebaseCall} from '@app/shared/utils/logger'
import {deleteUser, FirebaseAuthTypes} from '@react-native-firebase/auth'
import {doc, getDoc, setDoc, updateDoc} from '@react-native-firebase/firestore'

// ✅ updateDoc 전용
export type UserUpdate = UpdateInput<UserJoinRequest>

export const userRemote = {
  setProfile: (uid: string, payload: User) => {
    return firebaseCall('authRemote.setProfile', async () => {
      const userRef = doc(firestore, 'users', uid)
      await setDoc(userRef, payload as any, {merge: true})
    })
  },
  updateProfile: (uid: string, payload: Record<string, any>) => {
    return firebaseCall('authRemote.updateProfile', async () => {
      const userRef = doc(firestore, 'users', uid)
      await updateDoc(userRef, payload as any)
    })
  },
  getProfile: (uid: string) => {
    return firebaseCall('authRemote.getProfile', async () => {
      const docRef = doc(firestore, 'users', uid)
      return await getDoc(docRef)
    })
  },
  deleteUser: (user: FirebaseAuthTypes.User) => {
    return firebaseCall('authRemote.deleteUser', async () => {
      await deleteUser(user)
    })
  },
}
