import {getApp} from '@react-native-firebase/app'
import {
  doc,
  getDoc,
  getFirestore,
  setDoc,
  Timestamp,
} from '@react-native-firebase/firestore'
import {User} from '../types/firebase'

const firestore = getFirestore(getApp())

export const fetchUserProfile = async (uid: string): Promise<User | null> => {
  const userDoc = await getDoc(doc(firestore, 'users', uid))

  if (!userDoc.exists()) return null
  return {uid: userDoc.id, ...userDoc.data()} as User
}

//유저 더미 데이터 생성 용
export const generateGuestUsers = async () => {
  const promises = []
  const now = Date.now()
  for (let i = 1; i <= 10; i++) {
    const current = now + 1
    const uid = `guest_${current}`
    const user = {
      uid,
      authority: 'GUEST',
      email: `guest${current}@example.com`,
      isGuest: true,
      lastSeen: Timestamp.now(),
      nickname: `게스트${current}`,
      photoURL: '',
      status: i % 2 === 0 ? 'online' : 'offline',
    }

    const userRef = doc(firestore, 'users', uid)
    promises.push(setDoc(userRef, user))
  }

  try {
    await Promise.all(promises)
    console.log('✅ Guest users created successfully.')
  } catch (error) {
    console.error('❌ Failed to create guest users:', error)
  }
}

export const fetchUsersPaged = async () => {}
