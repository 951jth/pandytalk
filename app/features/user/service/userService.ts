import {userRemote} from '@app/features/user/data/userRemote.firebase'
import {type User, type UserJoinRequest} from '@app/shared/types/auth'
import type {UpdateInput} from '@app/shared/types/firebase'
import {convertTimestampsToMillis} from '@app/shared/utils/firebase'
import type {FirebaseAuthTypes} from '@react-native-firebase/auth'
import {serverTimestamp} from '@react-native-firebase/firestore'

export const userService = {
  setProfile: async (
    cred: FirebaseAuthTypes.UserCredential,
    {displayName, note, intro, photoURL}: UserJoinRequest,
  ) => {
    //1. 프로필 이미지가 있으면 파일업로드
    // let newPhotoURL = null
    // if (photoURL) {
    //   newPhotoURL = await fileService.uploadFile(photoURL)
    // }
    // 2) users/{uid} 신청 정보 저장 (승인 대기)
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
  fetchProfile: async (uid: string, payload: UpdateInput<User>) => {
    await userRemote.updateProfile(uid, payload)
  },
  updateLastSeen: async (uid: string) => {
    const lastSeen = serverTimestamp()
    await userRemote.updateProfile(uid, {lastSeen})
  },
  getProfile: async (uid: string) => {
    const snapshot = await userRemote.getProfile(uid)
    if (!snapshot.exists()) throw new Error('User not found')
    const data = snapshot.data()
    const timestampConverted = convertTimestampsToMillis(data) //timestamp를 클라이언트 포맷으로
    return {
      ...timestampConverted,
    } as User
  },
}
