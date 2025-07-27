import firestore from '@react-native-firebase/firestore'
import {useSelector} from 'react-redux'
import store, {type RootState} from '../store/store'
import {setTimeOffset} from '../store/timeSlice'

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

export async function initTimeOffset() {
  const serverTime = await getServerTimeInMillis()
  const clientTime = Date.now()
  const offset = serverTime - clientTime
  store.dispatch(setTimeOffset(offset))
}

export function useServerNow(): number {
  //현재 firebase 서버시간을 알려주는 함수임
  const offset = useSelector((state: RootState) => state.time.offset)
  return Date.now() + (offset ?? 0)
}
