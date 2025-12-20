import {userRemote} from '@app/features/user/data/userRemote.firebase'
import {auth} from '@app/shared/firebase/firestore'
import {type User, type UserJoinRequest} from '@app/shared/types/auth'
import type {UpdateInput} from '@app/shared/types/firebase'
import {convertTimestampsToMillis} from '@app/shared/utils/firebase'
import store from '@app/store/store'
import type {FirebaseAuthTypes} from '@react-native-firebase/auth'
import {serverTimestamp} from '@react-native-firebase/firestore'
import {Alert} from 'react-native'

export const userService = {
  //프로필 생성
  setProfile: async (
    cred: FirebaseAuthTypes.UserCredential,
    {displayName, note, intro, photoURL}: UserJoinRequest,
  ) => {
    const nowTime = serverTimestamp()
    const payload = {
      uid: cred.user.uid,
      email: cred?.user?.email,
      displayName: cred?.user?.displayName || displayName,
      photoURL: photoURL || cred?.user?.photoURL || null,
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
    } as User

    await userRemote.setProfile(cred.user.uid, payload)
  },
  //프로필 정보 수정
  fetchProfile: async (uid: string, payload: UpdateInput<User>) => {
    await userRemote.updateProfile(uid, payload)
  },
  //마지막 읽음 날짜 갱신
  updateLastSeen: async (uid: string) => {
    const lastSeen = serverTimestamp()
    await userRemote.updateProfile(uid, {lastSeen})
  },
  //프로필 가져오기
  getProfile: async (uid: string) => {
    const snapshot = await userRemote.getProfile(uid)
    if (!snapshot.exists()) throw new Error('User not found')
    const data = snapshot.data()
    const timestampConverted = convertTimestampsToMillis(data) //timestamp를 클라이언트 포맷으로
    return {
      ...timestampConverted,
    } as User
  },
  //유저 정보 수정(어드민)
  updateUserStatus: async (status: User['accountStatus'], formValues: User) => {
    const nowTime = serverTimestamp()
    const state = store.getState()
    const currentAdminUid = state?.user?.data?.uid

    if (!formValues?.uid) return
    if (!currentAdminUid) return

    // 수정 가능한 필드만 골라서 명시적으로 작성
    const payload: Partial<User> = {
      accountStatus: status,
      isConfirmed: status === 'confirm',
      updatedAt: nowTime,
      lastSeen: nowTime,
      note: (formValues.note ?? '').trim(),
      intro: (formValues.intro ?? '').trim(),
      displayName: formValues.displayName,
      groupId: formValues.groupId,
      photoURL: formValues.photoURL,
    }

    if (status === 'confirm') {
      payload.approvedAt = nowTime
      payload.approvedBy = currentAdminUid
    } else if (status === 'reject') {
      payload.rejectedAt = nowTime
      payload.rejectedBy = currentAdminUid
    }
    await userRemote.updateProfile(formValues?.uid, payload)
  },
  deleteMyAccount: async () => {
    const user = auth.currentUser
    try {
      if (!user) return
      await userRemote.deleteUser(user)
      Alert.alert('탈퇴성공', '회원 탈퇴 되었습니다.')
      // 여기서부터는 계정이 Auth에서 삭제된 상태
      // 추가로 Firestore/Storage 데이터도 정리해주면 좋음
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        // 비밀번호 다시 입력시키거나, 소셜 로그인 다시 유도 필요
        console.log('재인증 필요')
      } else {
        console.error(err)
      }
    }
  },
}
