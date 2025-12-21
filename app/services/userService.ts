import {User} from '@app/shared/types/auth'
import {getApp} from '@react-native-firebase/app'
import {getAuth} from '@react-native-firebase/auth'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from '@react-native-firebase/firestore'
import {AppDispatch} from '../store/store'
import {setUser} from '../store/userSlice'

const app = getApp()
const firestore = getFirestore(app)
const authInstance = getAuth()

//유저 프로필 조회
export const fetchUserProfile = async (uid: string): Promise<User | null> => {
  const userDoc = await getDoc(doc(firestore, 'users', uid))

  if (!userDoc.exists()) return null
  return {id: userDoc.id, ...userDoc.data()} as User
}

//최근 접속 시간 갱신함수
// export async function updateLastSeen(uid: string): Promise<void> {
//   if (!uid) return
//   const userRef = doc(firestore, 'users', uid)
//   try {
//     await updateDoc(userRef, {
//       lastSeen: serverTimestamp(),

//       status: 'offline',
//     })
//   } catch (error) {
//     console.error('lastSeen 갱신 실패:', error)
//   }
// }

// 사용자 오프라인 설정
// 현재 online, offline status는 사용하지 않을 예정
// 사용자가 사용중인지 사용하지않는지 클라이언트단에서 완벽히 추적하기 어렵고,
// 현재 앱 구조상 유저의 접속정보를 표기해주는 UX가 중요하지않고,
// 도리어 파생되는 오류로인해 혼동할 가능성있음

// 유저 상태가 바뀔 수 있는 케이스
// - AppState 변경 (active ↔ background)
// - 앱 kill/crash/OS 강제 종료
// - 네트워크 단절/복구
// - 기기 재부팅
// - 로그인/로그아웃/계정 전환
// - 여러 기기 동시 로그인
// - RN JS 쓰레드/타이머 제한
export async function updateUserOffline(uid: string): Promise<void> {
  if (!uid) return
  const userRef = doc(firestore, 'users', uid)
  try {
    await updateDoc(userRef, {
      status: 'offline',
    })
  } catch (e) {
    console.error('setUserOffline 오류:', e)
  }
}

//유저값 초기 데이터세팅
export const initialUserInfo = async (uid: string, dispatch: AppDispatch) => {
  const userRef = doc(firestore, 'users', uid)
  const currentUser = authInstance.currentUser
  const initialFormValues = {
    uid,
    authority: 'USER',
    email: currentUser?.email ?? '',
    isGuest: true,
    lastSeen: serverTimestamp(),
    displayName: currentUser?.email ?? '',
    photoURL: '',
    status: 'online',
  } as User

  try {
    await setDoc(userRef, initialFormValues)
    dispatch(setUser(initialFormValues))
    console.log('✅ 사용자 정보 초기화 완료')
  } catch (err) {
    console.log(JSON.stringify(err))
    console.error('❌ 사용자 정보 초기화 실패:', err)
  }
}

/**
 * 주어진 userId 배열을 기준으로 해당 유저 정보를 Firestore에서 조회합니다.
 * Firestore의 'in' 쿼리 제한 (10개) 고려하여 자동 분할 처리함.
 *
 * @param userIds 조회할 userId 문자열 배열
 * @returns User[] 유저 정보 배열
 */
export const getUsersByIds = async (
  userIds: string[],
): Promise<User[] | any> => {
  if (!userIds || userIds.length === 0) return []

  const chunkSize = 10
  const chunks: string[][] = []

  for (let i = 0; i < userIds.length; i += chunkSize) {
    chunks.push(userIds.slice(i, i + chunkSize))
  }

  //현재 나와 관계되고, 승인된 유저들만 조회
  const results = await Promise.all(
    chunks.map(async chunk => {
      const q = query(
        collection(firestore, 'users'),
        where('uid', 'in', chunk),
        where('accountStatus', '==', 'confirm'),
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => {
        if (doc?.id) return {id: doc?.id, ...doc.data()} as User
      })
    }),
  )
  // 🔹 결과 flatten
  return results.flat()
}
