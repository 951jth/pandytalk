import {firestore, messaging} from '@app/shared/firebase/firestore'
import {firebaseCall} from '@app/shared/utils/logger'
import {
  arrayRemove,
  arrayUnion,
  doc,
  setDoc,
} from '@react-native-firebase/firestore'

export const fcmRemote = {
  // 3. FCM 토큰 가져오기
  async getFcmToken(): Promise<string | undefined> {
    return await firebaseCall('fcmRemote.getFcmToken', () =>
      messaging.getToken(),
    )
  },

  // 4. 서버(DB)에 토큰 저장
  async saveTokenToUser(uid: string, token: string): Promise<void> {
    const userRef = doc(firestore, 'users', uid)

    return firebaseCall('fcmRemote.saveTokenToUser', () =>
      setDoc(userRef, {fcmTokens: arrayUnion(token)}, {merge: true}),
    )
  },

  // 5. 서버(DB)에 토큰 삭제
  async reomveTokenToUser(uid: string, token: string) {
    return firebaseCall('fcmRemote,reomveTokenToUser', async () => {
      await setDoc(
        doc(firestore, 'users', uid),
        {fcmTokens: arrayRemove(token)},
        {merge: true},
      )
    })
  },
}
