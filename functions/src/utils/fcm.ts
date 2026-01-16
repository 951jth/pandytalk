/**
 * Firestore에서 해당 사용자의 fcmToken을 제거
 * @param userId Firestore 내 사용자 문서 ID
 * @param token 제거할 FCM 토큰
 */
import admin from 'firebase-admin'
import {isEmpty} from 'lodash'

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

// 메인 함수
export const removeEmptyValues = (obj: any): any => {
  // 1. 배열인 경우: 내부 요소 청소 후, 빈 요소 필터링
  if (Array.isArray(obj)) {
    return obj.map(v => removeEmptyValues(v)).filter(v => !isEmpty(v))
  }

  // 2. 객체인 경우: 내부 속성 재귀적으로 청소
  if (typeof obj === 'object' && obj !== null) {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      const cleanValue = removeEmptyValues(value)
      // 청소된 값이 '비어있지 않을 때만' 결과에 포함
      if (!isEmpty(cleanValue)) {
        acc[key] = cleanValue
      }
      return acc
    }, {} as any)
  }

  // 3. 기본 타입(숫자, 불리언 등)은 그냥 반환
  return obj
}
