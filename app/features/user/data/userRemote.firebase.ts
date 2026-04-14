import {firebaseCall} from '@app/shared/firebase/firebaseUtils'
import {firestore} from '@app/shared/firebase/firestore'
import {toPageResult} from '@app/shared/firebase/pagination'
import {type User, type UserJoinRequest} from '@app/shared/types/auth'
import {UpdateInput} from '@app/shared/types/firebase'
import {deleteUser, FirebaseAuthTypes} from '@react-native-firebase/auth'
import {
  collection,
  doc,
  endAt,
  getDoc,
  getDocs,
  limit,
  or,
  orderBy,
  query,
  setDoc,
  startAfter,
  startAt,
  updateDoc,
  where,
} from '@react-native-firebase/firestore'

// ✅ updateDoc 전용
export type UserUpdate = UpdateInput<UserJoinRequest>

// 유저 목록 조회 함수 인자 타입 정의
export type GetUsersParams = {
  groupId?: string | null
  authority?: User['authority']
  searchText?: string
  pageSize?: number
  pageParam?: any // React Query의 pageParam (보통 DocumentSnapshot)
  isConfirmed?: boolean | null
}

export const userRemote = {
  setProfile: (uid: string, payload: User) => {
    return firebaseCall('userRemote.setProfile', async () => {
      const userRef = doc(firestore, 'users', uid)
      await setDoc(userRef, payload as any, {merge: true})
    })
  },
  updateProfile: (uid: string, payload: Record<string, any>) => {
    return firebaseCall('userRemote.updateProfile', async () => {
      const userRef = doc(firestore, 'users', uid)
      await updateDoc(userRef, payload as any)
    })
  },
  getProfile: (uid: string) => {
    return firebaseCall('userRemote.getProfile', async () => {
      const docRef = doc(firestore, 'users', uid)
      const snapshot = await getDoc(docRef)
      if (!snapshot.exists()) return null
      const data = snapshot.data()
      return data
    })
  },
  deleteUser: (user: FirebaseAuthTypes.User) => {
    return firebaseCall('userRemote.deleteUser', async () => {
      await deleteUser(user)
    })
  },
  getUsersPage: ({
    groupId,
    authority,
    searchText = '',
    pageSize = 10,
    pageParam,
    isConfirmed,
  }: GetUsersParams) => {
    return firebaseCall('userRemote.getUsersPage', async () => {
      const usersRef = collection(firestore, 'users')
      let filters: any[] = []

      const isAdmin = authority === 'ADMIN'

      // 관리자가 아닐 때만 승인 여부 필터 적용 (관리자는 모두 볼 수 있음)
      if (!isAdmin && typeof isConfirmed == 'boolean') {
        filters = [where('isConfirmed', '==', isConfirmed)]
      }

      // 비관리자면: 그룹 아이디가 없으면 ADMIN만, 있으면 (내 그룹) OR (ADMIN) 조회
      if (!isAdmin) {
        if (!groupId) {
          filters.push(where('authority', '==', 'ADMIN'))
        } else {
          filters.push(
            or(
              where('authority', '==', 'ADMIN'),
              where('groupId', '==', groupId),
            ),
          )
        }
      }

      let q = query(usersRef, ...filters)
      if (searchText) {
        q = query(
          q,
          orderBy('displayName', 'asc'),
          orderBy('status', 'desc'),
          orderBy('lastSeen', 'desc'),
          startAt(searchText),
          endAt(searchText + '\uf8ff'),
        )
      } else {
        q = query(q, orderBy('status', 'desc'), orderBy('lastSeen', 'desc'))
      }

      // 페이지네이션
      q = query(q, limit(pageSize))
      if (pageParam) {
        q = query(q, startAfter(pageParam))
      }

      const snap = await getDocs(q)
      const result = toPageResult(
        snap.docs,
        pageSize,
        d => ({id: d.id, ...d.data()}) as User,
      )
      return result
    })
  },
  getUsersByIds: (uids: string[]) => {
    if (!uids.length) return Promise.resolve([])

    return firebaseCall('userRemote.getUsersByUidChunk', async () => {
      const q = query(collection(firestore, 'users'), where('uid', 'in', uids))
      const snap = await getDocs(q)
      return snap.docs?.map(doc => ({id: doc.id, ...doc.data()}) as User)
    })
  },
}
