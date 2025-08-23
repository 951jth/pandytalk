import {signInWithEmailAndPassword} from '@react-native-firebase/auth'
import {
  collection,
  getDocs,
  limit,
  query,
  startAfter,
  writeBatch,
} from '@react-native-firebase/firestore'
import {orderBy} from 'lodash'
import {Alert} from 'react-native'
import {auth, firestore} from '../store/firestore'

export async function signInEmail(email: string, password: string) {
  const {user} = await signInWithEmailAndPassword(auth, email, password)
  // 최신 상태 반영
  await user.reload()
  if (!user.emailVerified) {
    // UI 안내: 메일함 확인/재전송 버튼 제공
    throw new Error('이메일 인증이 필요합니다.')
  }
  return user
}

/**
 * ADMIN/MANAGER 를 제외한 모든 users 문서 삭제
 * - 페이지네이션: __name__ (문서 ID) 기준
 * - 배치 제한: 500건씩 커밋
 * - 보안규칙: 호출 주체가 실제로 삭제 권한(관리자)이어야 함
 */

export async function deleteNonPrivilegedUsers() {
  const pageSize = 500
  let lastDoc: any = null
  let totalDeleted = 0

  Alert.alert('유저 정보를 삭제합니다.')

  while (true) {
    const q = lastDoc
      ? query(
          collection(firestore, 'users'),
          orderBy('__name__'),
          startAfter(lastDoc),
          limit(pageSize),
        )
      : query(
          collection(firestore, 'users'),
          orderBy('__name__'),
          limit(pageSize),
        )

    const snap = await getDocs(q)
    if (snap.empty) break

    const batch = writeBatch(firestore)
    let count = 0

    snap.docs.forEach(d => {
      const authority = d.get('authority') as
        | 'ADMIN'
        | 'MANAGER'
        | 'USER'
        | string
        | null
        | undefined
      // ADMIN / MANAGER 는 보존, 그 외/누락/null 은 삭제
      if (authority !== 'ADMIN' && authority !== 'MANAGER') {
        batch.delete(d.ref)
        count++
      }
    })

    if (count > 0) {
      await batch.commit()
      totalDeleted += count
    }

    lastDoc = snap.docs[snap.docs.length - 1]
  }

  return {deleted: totalDeleted}
}
