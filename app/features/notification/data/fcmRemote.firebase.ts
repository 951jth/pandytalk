import {firebaseCall} from '@app/shared/firebase/firebaseUtils'
import {firestore, messaging} from '@app/shared/firebase/firestore'
import {
  arrayRemove,
  arrayUnion,
  doc,
  setDoc,
} from '@react-native-firebase/firestore'

export const fcmRemote = {
  // FCM 토큰 가져오기
  async getFcmToken(): Promise<string | undefined> {
    return await firebaseCall('fcmRemote.getFcmToken', () =>
      messaging.getToken(),
    )
  },

  // 서버(DB)에 토큰 저장
  async saveTokenToUser(uid: string, token: string): Promise<void> {
    const userRef = doc(firestore, 'users', uid)

    return firebaseCall('fcmRemote.saveTokenToUser', () =>
      setDoc(userRef, {fcmTokens: arrayUnion(token)}, {merge: true}),
    )
  },

  // 서버(DB)에 토큰 삭제
  async removeTokenToUser(uid: string, token: string) {
    return firebaseCall('fcmRemote.removeTokenToUser', async () => {
      await setDoc(
        doc(firestore, 'users', uid),
        {fcmTokens: arrayRemove(token)},
        {merge: true},
      )
    })
  },
}
