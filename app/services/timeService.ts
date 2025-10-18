import firestore from '@react-native-firebase/firestore'

/**
 * Firestore 서버 시간(ms)을 반환하는 RN Firebase 전용 함수
 */
export async function getServerTimeInMillis(): Promise<number> {
  try {
    const tempDocRef = firestore().collection('temp').doc('__server_time__')

    // 1. 서버 타임스탬프 기록
    await tempDocRef.set({
      serverTime: firestore.FieldValue.serverTimestamp(),
    })

    // 2. 서버 시간 읽기
    const snapshot = await tempDocRef.get()
    const serverTime = snapshot.data()?.serverTime

    if (!serverTime || typeof serverTime.toMillis !== 'function') {
      throw new Error('서버 시간이 null이거나 Timestamp가 아님')
    }

    // 3. Timestamp → number(ms)
    return serverTime.toMillis()
  } catch (error) {
    console.error('🔥 RN Firebase 서버 시간 가져오기 실패:', error)
    throw error
  }
}
