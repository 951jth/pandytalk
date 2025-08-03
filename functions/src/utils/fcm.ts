/**
 * Firestore에서 해당 사용자의 fcmToken을 제거
 * @param userId Firestore 내 사용자 문서 ID
 * @param token 제거할 FCM 토큰
 */
import admin from 'firebase-admin'

/**
 * Firestore에서 해당 사용자의 FCM 토큰을 제거
 */
export const removeFcmTokenFromUser = async (userId: string, token: string) => {
  try {
    const db = admin.firestore()
    const userRef = db.doc(`users/${userId}`)

    await userRef.update({
      fcmTokens: admin.firestore.FieldValue.arrayRemove(token),
    })

    console.log(`✅ FCM 토큰 제거 완료: ${token}`)
  } catch (error) {
    console.error(`❌ FCM 토큰 제거 실패:`, error)
  }
}
