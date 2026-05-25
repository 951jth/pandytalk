import {
  userRemote,
  type GetUsersParams,
} from '@app/features/user/data/userRemote.firebase'
import {auth} from '@app/shared/firebase/firestore'
import {type User, type UserJoinRequest} from '@app/shared/types/auth'
import type {UpdateInput} from '@app/shared/types/firebase'
import {convertTimestampsToMillis} from '@app/shared/utils/firebase'
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
    const user = await userService.getProfile(uid)
    if (user.authority === 'TEST') {
      throw new Error('TEST 계정은 프로필을 수정할 수 없습니다.')
    }
    await userRemote.updateProfile(uid, payload)
  },
  //마지막 활동 기록 및 상태 갱신
  updateLastSeen: async (uid: string, status: User['status'] = 'online') => {
    const lastSeen = serverTimestamp()
    await userRemote.updateProfile(uid, {lastSeen, status})
  },
  //프로필 가져오기
  getProfile: async (uid: string) => {
    const data = await userRemote.getProfile(uid)
    const timestampConverted = convertTimestampsToMillis(data) //timestamp를 클라이언트 포맷으로
    return {
      ...timestampConverted,
    } as User
  },
  //유저 정보 수정(어드민)
  updateUserStatus: async (
    currentAdminUid: string,
    status: User['accountStatus'],
    formValues: User,
  ) => {
    const nowTime = serverTimestamp()
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
    if (!user) return

    try {
      const uid = user.uid
      const profile = await userService.getProfile(uid)

      if (profile.authority === 'TEST') {
        throw new Error('TEST 계정은 탈퇴할 수 없습니다.')
      }

      // Auth 삭제가 성공하면 onAuthUserDeleted Functions 트리거가 프로필/이미지/멤버십 정리를 처리합니다.
      await userRemote.deleteUser(user)
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        Alert.alert(
          '보안 인증 필요',
          '개인정보 보호를 위해 다시 로그인하신 후 탈퇴를 진행해 주세요.',
          [{text: '확인'}],
        )
      } else {
        console.error('탈퇴 처리 중 오류:', err)
        throw err
      }
    }
  },
  deleteUserByAdmin: async (currentAdminUid: string, targetUser: User) => {
    if (!currentAdminUid) throw new Error('관리자 정보가 없습니다.')
    if (!targetUser?.uid) throw new Error('삭제할 유저 정보가 없습니다.')
    if (currentAdminUid === targetUser.uid) {
      throw new Error('본인 계정은 관리자 화면에서 삭제할 수 없습니다.')
    }
    if (targetUser.authority === 'ADMIN' || targetUser.authority === 'TEST') {
      throw new Error('관리자 또는 테스트 계정은 삭제할 수 없습니다.')
    }

    await userRemote.deleteUserByAdmin(targetUser.uid)
  },

  getUsers: async ({
    groupId,
    authority = 'USER',
    searchText = '',
    pageSize = 20,
    pageParam,
    isConfirmed,
  }: GetUsersParams) => {
    const {items, nextPageParam, hasNext} = await userRemote.getUsersPage({
      groupId,
      authority,
      searchText,
      pageSize,
      pageParam,
      isConfirmed,
    })

    return {
      users: items,
      lastVisible: nextPageParam,
      isLastPage: !hasNext,
    }
  },

  getUsersByIds: async (uids: string[]) => {
    const chunkSize = 10
    const chunks: string[][] = []
    //페이지 사이즈는 10까지 가능
    for (let i = 0; i < uids?.length; i += chunkSize) {
      chunks.push(uids.slice(i, i + chunkSize))
    }
    const promises = chunks?.map(chunk => userRemote.getUsersByIds(chunk))
    const results = await Promise.all(promises)
    return results?.flat()
  },
}
