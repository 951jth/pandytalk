import {logger} from '@app/shared/services/logger'
import {isExpectedError} from '@app/shared/utils/logger'
import {
  FirebaseFirestoreTypes,
  onSnapshot,
} from '@react-native-firebase/firestore'

const BE_QUITE = false

//파이어베이스 네트워크 요청 로깅용 함수.
export const firebaseCall = async <T>(
  logName: string,
  fn: () => Promise<T>,
): Promise<T> => {
  if (!__DEV__ || BE_QUITE) return await fn()
  const startTime = Date.now()

  try {
    // 요청 시작
    const result = await fn()
    const duration = Date.now() - startTime

    // ✅ 성공 시: 아이콘(🔥)을 맨 앞으로 배치
    // 포맷: 🔥 [Firestore/Call] ✅ 함수명 (시간)
    console.groupCollapsed(`🔥 [Firestore/Call] ✅ ${logName} (${duration}ms)`)
    console.log('Result:', result) // 펼치면 결과 데이터 보임
    console.groupEnd()

    return result
  } catch (error: any) {
    // ❌ 실패 시: 아이콘(🔥)을 맨 앞으로 배치
    const duration = Date.now() - startTime
    const expected = isExpectedError(error)

    // 에러는 펼쳐서 강조 (groupCollapsed 대신 group 사용)
    console.group(`🔥 [Firestore/Call] ❌ ${logName} (${duration}ms)`)
    if (expected) {
      console.log('Reason: Data might not exist yet or permission denied.')
      console.log('Original Error:', error.message)
    } else {
      logger.error(`[Firestore/Call] ${logName} failed`, error)
    }
    console.groupEnd()

    throw error
  }
}

const shortenString = (str: string, maxLength: number = 60) => {
  if (str.length <= maxLength) return str
  const part = Math.floor(maxLength / 2) - 2
  return `${str.substring(0, part)}...${str.substring(str.length - part)}`
}

export const firebaseObserver = (
  logName: string, // 원본 풀네임 (식별용)
  q: FirebaseFirestoreTypes.Query,
  onNext: (snapshot: FirebaseFirestoreTypes.QuerySnapshot) => void,
  onError?: (error: Error) => void,
): (() => void) => {
  if (!__DEV__ || BE_QUITE) {
    return q.onSnapshot(
      {includeMetadataChanges: true},
      onNext,
      onError, // 에러 콜백이 있으면 전달, 없으면 undefined
    )
  }
  const startTime = Date.now()

  // ✅ [핵심] 보여주기용 짧은 이름 생성
  const displayName = shortenString(logName)

  // 1. [Start]
  console.log(
    `%c🔥 [Firestore/Sub] 🟢 START: ${displayName}`,
    'font-weight: bold;',
  )

  const unsubscribe = q.onSnapshot(
    {includeMetadataChanges: true},
    snapshot => {
      const source = snapshot.metadata.fromCache ? '(Cache)' : '(Server)'
      const docChanges = snapshot.docChanges().length
      const count = snapshot.size

      // 2. [Update] 제목에는 '짧은 이름'을 사용해서 한 줄 유지
      console.groupCollapsed(
        `%c🔥 [Firestore/Sub] 📡 UPDATE: ${logName} (${source}) | Count: ${count}`,
        'font-weight: bold;',
      )

      // ▼ [Detail] 펼치면 원본 '긴 이름'을 확인할 수 있게 배치
      console.log(`🆔 Full ID: ${logName}`)
      console.log(`⏱ Time: ${new Date().toLocaleTimeString()}`)
      console.log(`🔄 Changes: ${docChanges}`)

      if (docChanges > 0) {
        console.log(
          '📝 Details:',
          snapshot
            .docChanges()
            .map(c => `${c.type.toUpperCase()} -> ${c.doc.id}`),
        )
      }

      console.groupEnd()

      onNext(snapshot)
    },
    (error: any) => {
      // 3. [Error] 에러는 중요하니까 원본 이름 노출 (혹은 줄여도 됨)
      const isExpected = isExpectedError(error)

      if (isExpected) {
        // 1. 예상된 에러(방 없음 등)는 '경고(Warn)' 수준으로 낮춰서 로그 출력
        // 빨간색(Error) 대신 노란색(Warn) 혹은 그냥 로그로 찍어서 시각적 스트레스 감소
        console.groupCollapsed(
          `🔥 [Firestore/Sub] ⚠️ EMPTY/RESTRICTED: ${displayName}`,
        )
        console.log('Reason: Room might not exist yet or permission denied.')
        console.log('Original Error:', error.message)
        console.groupEnd()

        // 필요하다면 onError를 호출하지 않거나, 별도 처리를 할 수 있음
        // if (onError) onError(error)
      } else {
        // 2. 진짜 에러는 여전히 빨간색으로 출력
        console.group(`🔥 [Firestore/Sub] ❌ FAIL: ${displayName}`)
        console.error('Error Details:', error)
        console.log(`Target: ${logName}`)
        console.groupEnd()

        if (onError) onError(error)
      }
    },
  )

  return () => {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    // 4. [Stop]
    console.log(
      `%c🔥 [Firestore/Sub] 🛑 STOP: ${displayName} | Active: ${duration}s`,
      'font-weight: bold;',
    )
    unsubscribe()
  }
}

export const firebaseRefObserver = (
  logName: string,
  ref: FirebaseFirestoreTypes.DocumentReference,
  onNext: (snapshot: FirebaseFirestoreTypes.DocumentSnapshot) => void,
  onError?: (error: any) => void,
): (() => void) => {
  const options = {includeMetadataChanges: true}

  if (!__DEV__ || BE_QUITE) {
    return onSnapshot(ref, options, onNext, onError)
  }

  const displayName = shortenString(logName)

  console.log(
    `%c🔥 [Firestore/Sub] 🟢 START: ${displayName}`,
    'font-weight: bold;',
  )

  return onSnapshot(
    ref,
    options,
    snapshot => {
      const source = snapshot.metadata.fromCache ? '(Cache)' : '(Server)'
      const exists = snapshot.exists()

      console.groupCollapsed(
        `%c🔥 [Firestore/Sub] 📡 UPDATE: ${displayName} ${source} | Exists: ${exists}`,
        'font-weight: bold;',
      )
      console.log(`🆔 Full ID: ${logName}`)
      console.log(`📄 Path: ${ref.path}`)
      console.log(`⏱ Time: ${new Date().toLocaleTimeString()}`)
      console.log(`✅ Exists: ${exists}`)
      console.groupEnd()

      onNext(snapshot)
    },
    error => {
      const isExpected = isExpectedError(error)

      if (isExpected) {
        console.groupCollapsed(
          `🔥 [Firestore/Sub] ⚠️ EMPTY/RESTRICTED: ${displayName}`,
        )
        console.log('Reason: Doc might not exist yet or permission denied.')
        console.log('Original Error:', error.message)
        console.groupEnd()
      } else {
        console.group(`🔥 [Firestore/Sub] ❌ FAIL: ${displayName}`)
        console.error('Error Details:', error)
        console.log(`Target: ${logName}`)
        console.log(`Path: ${ref.path}`)
        console.groupEnd()
        onError?.(error)
      }
    },
  )
}
