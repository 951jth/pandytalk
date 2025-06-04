import {getApp} from '@react-native-firebase/app'
import {FirebaseAuthTypes, getAuth} from '@react-native-firebase/auth'
import {
  doc,
  getDoc,
  getFirestore,
  setDoc,
  updateDoc,
} from '@react-native-firebase/firestore'
import {User} from '../types/firebase'

const firestore = getFirestore(getApp())
const authInstance = getAuth()

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
      status: 'online',
    })
  } catch (error) {
    console.error('lastSeen 갱신 실패:', error)
  }
}

//사용자 오프라인 설정
export async function updateUserOffline(uid: string): Promise<void> {
  if (!uid) return
  const firestore = getFirestore()
  const userRef = doc(firestore, 'users', uid)
  try {
    await updateDoc(userRef, {
      status: 'offline',
    })
  } catch (e) {
    console.error('setUserOffline 오류:', e)
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
      authority: 'USER',
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

//유저값 초기 데이터세팅
export const initialUserInfo = async (
  uid: string,
  user: FirebaseAuthTypes.User,
) => {
  const firestore = getFirestore()
  const userRef = doc(firestore, 'users', uid)

  const initialFormValues = {
    uid,
    authority: 'USER',
    email: user?.email ?? '',
    isGuest: false,
    lastSeen: Date.now(),
    nickname: user?.email ?? '',
    photoURL: '',
    status: 'online',
  }

  try {
    await setDoc(userRef, initialFormValues)
    console.log('✅ 사용자 정보 초기화 완료')
  } catch (err) {
    console.error('❌ 사용자 정보 초기화 실패:', err)
  }
}
