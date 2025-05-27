import {getApp} from '@react-native-firebase/app'
import {doc, getDoc, getFirestore} from '@react-native-firebase/firestore'
import {User} from '../types/firebase'

const firestore = getFirestore(getApp())

export const fetchUserProfile = async (uid: string): Promise<User | null> => {
  const userDoc = await getDoc(doc(firestore, 'users', uid))

  if (!userDoc.exists()) return null
  return {uid: userDoc.id, ...userDoc.data()} as User
}

export const fetchUsersPaged = async () => {}
