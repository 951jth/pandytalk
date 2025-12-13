import {
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithEmailAndPassword,
  updateProfile,
} from '@react-native-firebase/auth'
import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  writeBatch,
} from '@react-native-firebase/firestore'
import type {FirebaseError} from 'firebase-admin'
import {orderBy} from 'lodash'
import {Alert} from 'react-native'
import {auth, firestore} from '../shared/firebase/firestore'
import store from '../store/store'
import type {requestUser, User} from '../types/auth'
import {fileUpload} from './fileService'

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

//유저 회원가입 신청
//1. firebase auth 등록 2. users 컬렉션 등록 3. 관리자 승인 필요
export async function submitSignupRequest({
  email,
  password,
  displayName,
  note,
  intro,
  photoURL,
}: requestUser) {
  try {
    // 1) Auth 계정 생성
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    const uid = cred.user.uid

    // 2) 프로필 이미지가 있으면 파일업로드
    let newPhotoURL = null
    if (photoURL) {
      newPhotoURL = await fileUpload(uid, photoURL)
    }
    // 3) users/{uid} 신청 정보 저장 (승인 대기)
    const nowTime = serverTimestamp()
    await updateProfile(cred.user, {displayName, photoURL: newPhotoURL})

    //     await setDoc(doc(db, 'users', cred.user.uid), {
    //   uid: cred.user.uid,
    //   email: cred.user.email,
    //   displayName,
    //   approved: false,
    //   createdAt: serverTimestamp(),
    //   updatedAt: serverTimestamp(),
    // });

    await setDoc(doc(firestore, 'users', uid), {
      uid: cred.user.uid,
      email: cred?.user?.email,
      displayName: cred?.user?.displayName || displayName,
      photoURL: cred?.user?.photoURL || newPhotoURL || null,
      authority: 'USER',
      status: 'offline',
      note: (note ?? '').trim(),
      intro: (intro ?? '').trim(),
      groupId: null,
      accountStatus: 'pending', // 'pending' | 'confirm' | 'reject'
      emailVerified: cred.user.emailVerified ?? false,
      isConfirmed: false,

      createdAt: nowTime,
      updatedAt: nowTime,
      lastSeen: nowTime,
    })
    return {ok: true, uid: uid}
  } catch (e) {
    console.log(e)
    const err = e as FirebaseError
    // Firestore 인덱스 필요 시(복합쿼리) 에러가 날 수 있습니다.
    // 콘솔에서 제시하는 인덱스 링크로 한 번 생성하면 해결됩니다.
    return {
      ok: false,
      code: err.code,
      message: (() => {
        switch (err.code) {
          // 인증/권한 관련
          case 'auth/email-already-in-use':
            return '이미 사용 중인 이메일입니다.'
          case 'auth/invalid-email':
            return '이메일 형식이 올바르지 않습니다.'
          case 'auth/weak-password':
            return '비밀번호가 너무 약합니다. (6자 이상 권장)'
          case 'auth/user-not-found':
            return '해당 계정을 찾을 수 없습니다.'
          case 'auth/wrong-password':
            return '비밀번호가 올바르지 않습니다.'
          case 'auth/too-many-requests':
            return '잠시 후 다시 시도해주세요. (로그인 시도 과다)'
          case 'permission-denied':
            return '권한이 없습니다. 잠시 후 다시 시도해주세요.'

          // Firestore / Storage 등 공통
          case 'unavailable':
            return '현재 서비스를 이용할 수 없습니다. 네트워크 상태를 확인해주세요.'
          case 'deadline-exceeded':
            return '요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.'
          case 'resource-exhausted':
            return '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'

          // 기본
          default:
            return '요청이 실패하였습니다. 잠시 후 다시 시도해주세요.'
        }
      })(),
    }
  }
}

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

export const memberStatusUpdate = async (
  status: User['accountStatus'],
  formValues: User,
) => {
  try {
    const nowTime = serverTimestamp()
    const state = store.getState()
    const currentAdminUid = state?.user?.data?.uid

    if (!formValues?.uid) return
    if (!currentAdminUid) return

    const userRef = doc(firestore, 'users', formValues.uid)

    // 수정 가능한 필드만 골라서 명시적으로 작성
    const payload: Partial<User> = {
      accountStatus: status,
      isConfirmed: status === 'confirm',
      updatedAt: nowTime,
      lastSeen: nowTime,
      note: (formValues.note ?? '').trim(),
      intro: (formValues.intro ?? '').trim(),
      // 필요하면 여기서 추가 필드만 직접 나열
      displayName: formValues.displayName,
      groupId: formValues.groupId,
    }

    if (status === 'confirm') {
      payload.approvedAt = nowTime
      payload.approvedBy = currentAdminUid
    } else if (status === 'reject') {
      payload.rejectedAt = nowTime
      payload.rejectedBy = currentAdminUid
    }
    console.log(payload)
    await updateDoc(userRef, payload)
    console.log('✅ 사용자 상태 업데이트 완료:', payload)
  } catch (error) {
    console.error('🔥 사용자 상태 업데이트 실패:', error)
  }
}

export async function deleteMyAccount() {
  const user = auth.currentUser

  if (!user) {
    throw new Error('로그인된 사용자가 없습니다.')
  }

  try {
    await deleteUser(user)
    Alert.alert('탈퇴성공', '회원 탈퇴 되었습니다.')
    // 여기서부터는 계정이 Auth에서 삭제된 상태
    // 추가로 Firestore/Storage 데이터도 정리해주면 좋음
  } catch (err: any) {
    if (err.code === 'auth/requires-recent-login') {
      // 비밀번호 다시 입력시키거나, 소셜 로그인 다시 유도 필요
      // ex) 재로그인 후 다시 deleteMyAccount 호출
      console.log('재인증 필요')
    } else {
      console.error(err)
    }
  }
}
