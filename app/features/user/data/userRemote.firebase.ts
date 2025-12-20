import {firestore} from '@app/shared/firebase/firestore'
import {type User, type UserJoinRequest} from '@app/shared/types/auth'
import {UpdateInput} from '@app/shared/types/firebase'
import {firebaseCall} from '@app/shared/utils/logger'
import {doc, setDoc, updateDoc} from '@react-native-firebase/firestore'

// ✅ updateDoc 전용
export type UserUpdate = UpdateInput<UserJoinRequest>

export const userRemote = {
  setProfile: (uid: string, payload: User) => {
    return firebaseCall('authRemote.setProfile', async () => {
      console.log('uid', uid)
      console.log('payload', payload)
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
}
