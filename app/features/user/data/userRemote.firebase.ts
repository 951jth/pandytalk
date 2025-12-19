import {firestore} from '@app/shared/firebase/firestore'
import {User} from '@app/shared/types/auth'
import {UpdateInput} from '@app/shared/types/firebase'
import {firebaseCall} from '@app/shared/utils/logger'
import {doc, updateDoc} from '@react-native-firebase/firestore'

// ✅ updateDoc 전용
export type UserUpdate = UpdateInput<User>

export const userRemote = {
  updateProfile: (uid: string, payload: UserUpdate) => {
    return firebaseCall('authRemote.updateProfile', async () => {
      const userRef = doc(firestore, 'users', uid)
      await updateDoc(userRef, payload as any)
    })
  },
}
