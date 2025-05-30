import {getApp} from '@react-native-firebase/app'
import {
  doc,
  getDoc,
  getFirestore,
  setDoc,
  updateDoc,
} from '@react-native-firebase/firestore'
import {User} from '../types/firebase'

const firestore = getFirestore(getApp())

//유저 프로필 조회
export const fetchUserProfile = async (uid: string): Promise<User | null> => {
  const userDoc = await getDoc(doc(firestore, 'users', uid))

  if (!userDoc.exists()) return null
  return {uid: userDoc.id, ...userDoc.data()} as User
}

//최근 접속 시간 갱신함수
export async function updateLastSeen(uid: string): Promise<void> {
  if (!uid) return
  const firestore = getFirestore()
  const userRef = doc(firestore, 'users', uid)

  try {
    await updateDoc(userRef, {
      lastSeen: Date.now(),
    })
  } catch (error) {
    console.error('❌ lastSeen 갱신 실패:', error)
  }
}

//유저 더미 데이터 생성 용
export const generateGuestUsers = async () => {
  const promises = []
  const now = Date.now()
  for (let i = 1; i <= 10; i++) {
    const current = now + i
    const uid = `guest_${current}`
    const user = {
      uid,
      authority: 'GUEST',
      email: `guest${current}@example.com`,
      isGuest: true,
      lastSeen: current,
      nickname: `게스트${current}`,
      photoURL: '',
      status: 'offline',
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
