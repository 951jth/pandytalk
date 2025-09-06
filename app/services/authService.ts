import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from '@react-native-firebase/auth'
import fs, {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  query,
  setDoc,
  startAfter,
  updateDoc,
  where,
  writeBatch,
} from '@react-native-firebase/firestore'
import type {FirebaseError} from 'firebase-admin'
import type {Timestamp} from 'firebase-admin/firestore'
import {orderBy} from 'lodash'
import {Alert} from 'react-native'
import {auth, firestore} from '../store/firestore'
import store from '../store/store'
import type {GuestApplication, requestUser, User} from '../types/auth'
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

//게스트 신청
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
    const nowTime = fs.FieldValue.serverTimestamp()
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
      email: cred.user.email,
      displayName: cred.user.displayName,
      photoURL: cred?.user?.photoURL || null,
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
    })
    return {ok: true, uid: uid}
  } catch (e) {
    const err = e as FirebaseError
    // Firestore 인덱스 필요 시(복합쿼리) 에러가 날 수 있습니다.
    // 콘솔에서 제시하는 인덱스 링크로 한 번 생성하면 해결됩니다.
    return {
      ok: false,
      code: err.code,
      message:
        err.code === 'permission-denied'
          ? '권한이 없습니다. 잠시 후 다시 시도해주세요.'
          : '요청이 실패하였습니다. 잠시 후 다시 시도해주세요.',
    }
  }
}

// 게스트 신청서 요청 (현재 미사용)
export async function submitSignupRequestRegacy({
  email,
  password,
  displayName,
  note,
  intro,
}: GuestApplication) {
  try {
    const nowTime = fs.FieldValue.serverTimestamp()

    // 1) 중복 신청 방지 (pending/confirm 상태에 같은 이메일 존재하면 차단)
    const dupQ = query(
      collection(firestore, 'guestApplications'),
      where('email', '==', email),
      where('accountStatus', 'in', ['pending', 'confirm']),
    )
    const dupSnap = await getDocs(dupQ)
    if (!dupSnap.empty) {
      throw new Error('이미 신청되었거나 승인된 이메일입니다.')
    }

    // 2) 신청서 생성
    const docRef = await addDoc(collection(firestore, 'guestApplications'), {
      // ---- User 베이스 정보 (guestApplications가 User를 확장하려던 목적을 Firestore 문서로 녹임)
      email,
      displayName,
      photoURL: null, // 필요시 클라에서 수집해서 넣으세요
      authority: 'USER', // 당신의 User 모델에 맞게 기본 권한 지정
      status: 'offline', // (선택) 사용자 상태 모델과 일관되게

      // ---- 신청서 전용 입력
      note: note ?? '',
      intro: intro ?? '',
      groupId: null,

      // ---- 승인 상태
      accountStatus: 'pending', // 'confirm' | 'pending' | 'reject'
      approvedAt: null as Timestamp | null,
      approvedBy: null as string | null,
      rejectedAt: null as Timestamp | null,
      rejectedBy: null as string | null,
      emailVerified: false, // 신청 시점에는 보통 false

      // ---- 시간
      createdAt: nowTime,
      updatedAt: nowTime,
    })
    return {ok: true, applicationId: docRef.id}
  } catch (e) {
    const err = e as FirebaseError
    // Firestore 인덱스 필요 시(복합쿼리) 에러가 날 수 있습니다.
    // 콘솔에서 제시하는 인덱스 링크로 한 번 생성하면 해결됩니다.
    return {
      ok: false,
      code: err.code,
      message:
        err.code === 'permission-denied'
          ? '권한이 없습니다. 잠시 후 다시 시도해주세요.'
          : '요청이 실패하였습니다. 잠시 후 다시 시도해주세요.',
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
    const nowTime = fs.FieldValue.serverTimestamp()
    const state = store.getState()
    const currentAdminUid = state?.user?.data?.uid // ✅ 여기서 직접 uid 가져오기
    console.log(formValues, currentAdminUid)
    if (!formValues?.uid) return
    if (!currentAdminUid) return
    // Firestore doc 참조 (users 컬렉션)
    const userRef = doc(firestore, 'users', formValues.uid)

    // 업데이트 payload
    const payload: Partial<User> = {
      ...formValues,
      accountStatus: status,
      updatedAt: nowTime, // Firestore 서버 시간 기준
    }

    // 상태별 처리 (승인/거절 시 메타정보 기록)
    if (status === 'confirm') {
      payload.approvedAt = nowTime
      payload.approvedBy = currentAdminUid // 현재 로그인한 관리자 uid
    } else if (status === 'reject') {
      payload.rejectedAt = nowTime
      payload.rejectedBy = currentAdminUid
    }

    await updateDoc(userRef, payload)
    console.log('✅ 사용자 상태 업데이트 완료:', payload)
  } catch (error) {
    console.error('🔥 사용자 상태 업데이트 실패:', error)
  }
}
