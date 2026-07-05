import {FirebaseAuthTypes} from '@react-native-firebase/auth'
import {
  FirebaseFirestoreTypes,
  serverTimestamp,
  Timestamp,
} from '@react-native-firebase/firestore'
import type {ChatRoom} from '../types/chat'
import type {ServerTimestampField} from '../types/firebase'

// Timestamp/number → ms number 로 통일
export const toMillis = (
  v: number | FirebaseFirestoreTypes.Timestamp | undefined | null,
): number => {
  if (typeof v === 'number') return v
  if (v && typeof v.toMillis === 'function') return v.toMillis()
  return 0
}
// // ms number → Firestore Timestamp
export const toTimestamp = (ms: number) =>
  FirebaseFirestoreTypes.Timestamp.fromMillis(ms)

export const withServerTimestamps = <
  T extends object,
  TField extends string = string,
>(
  payload: T,
  fields: ServerTimestampField<TField>[],
) => {
  if (!fields.length) return payload

  const nowTime = serverTimestamp()
  return fields.reduce(
    (acc, field) => ({
      ...acc,
      [field]: nowTime,
    }),
    {...payload} as T &
      Partial<
        Record<ServerTimestampField<TField>, FirebaseFirestoreTypes.FieldValue>
      >,
  )
}

type TimestampLike = {
  toMillis?: () => number
  toDate?: () => Date
  seconds?: number | string
  nanoseconds?: number | string
  _seconds?: number | string
  _nanoseconds?: number | string
}

export function convertTimestampsToMillis<T = unknown>(obj: T): T {
  if (obj == null) return obj

  // Timestamp -> number
  if (obj instanceof Timestamp) {
    return obj.toMillis() as unknown as T
  }

  // Array -> map 재귀
  if (Array.isArray(obj)) {
    return obj.map(item => convertTimestampsToMillis(item)) as unknown as T
  }

  // Object -> key/value 재귀
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = convertTimestampsToMillis(value)
    }
    return result as T
  }

  // Primitive 값은 그대로 반환
  return obj
}

/** ServerTime(FieldValue | Timestamp) → ms number (미확정이면 null) */
export const toMillisFromServerTime = (v: unknown): number | null => {
  if (v == null) return null

  // number: ms(>=1e12) 또는 sec
  if (typeof v === 'number') {
    return v > 1e12 ? v : Math.floor(v * 1000)
  }

  // Date
  if (v instanceof Date) {
    return v.getTime()
  }

  const timestampLike = v as TimestampLike

  // Firestore Timestamp 인스턴스
  if (typeof timestampLike.toMillis === 'function') {
    try {
      return timestampLike.toMillis()
    } catch (error) {
      console.warn('Failed to convert timestamp with toMillis', error)
    }
  }
  if (typeof timestampLike.toDate === 'function') {
    try {
      const d = timestampLike.toDate()
      if (d instanceof Date) return d.getTime()
    } catch (error) {
      console.warn('Failed to convert timestamp with toDate', error)
    }
  }

  // {seconds, nanoseconds} 또는 {_seconds, _nanoseconds}
  {
    const s = timestampLike.seconds ?? timestampLike._seconds
    const ns = timestampLike.nanoseconds ?? timestampLike._nanoseconds ?? 0
    const sNum = typeof s === 'string' ? Number.parseInt(s, 10) : s
    const nsNum = typeof ns === 'string' ? Number.parseInt(ns, 10) : ns

    if (
      typeof sNum === 'number' &&
      typeof nsNum === 'number' &&
      Number.isFinite(sNum) &&
      Number.isFinite(nsNum)
    ) {
      return sNum * 1000 + Math.floor(nsNum / 1e6)
    }
  }

  // 문자열: ISO 또는 "FirestoreTimestamp(seconds=..., nanoseconds=...)"
  if (typeof v === 'string') {
    // 1) FirestoreTimestamp(...) 패턴 파싱
    const m = v.match(
      /FirestoreTimestamp\s*\(\s*seconds\s*=\s*(\d+)\s*,\s*nanoseconds\s*=\s*(\d+)\s*\)/i,
    )
    if (m) {
      const sec = Number(m[1])
      const nano = Number(m[2])
      if (Number.isFinite(sec) && Number.isFinite(nano)) {
        return sec * 1000 + Math.floor(nano / 1e6)
      }
    }
    // 2) ISO 등 Date.parse 지원 문자열
    const t = Date.parse(v)
    if (!Number.isNaN(t)) return t
  }

  // serverTimestamp() 미확정 sentinel 등이면 null
  return null
}
//ms -> fb timestamp
export function msToTs(ms?: number | null) {
  if (ms == null) return null
  const fixed = ms > 1e12 ? ms : Math.floor(ms * 1000) // sec일 수도 있으니 보정
  return Timestamp.fromMillis(fixed)
}

export function sortKey(item: ChatRoom): number {
  // lastMessageAt을 쓰는 경우(권장) 여기에 넣어두면 됨.
  const roomTime = toMillisFromServerTime(item.lastMessageAt ?? item.createdAt)
  return roomTime ?? toMillis(item.lastMessage?.createdAt)
}

// any → RNFirebase Timestamp 로 정규화
export const toRNFTimestamp = (
  v: unknown,
): FirebaseFirestoreTypes.Timestamp | null => {
  if (v == null) return null
  const timestampLike = v as TimestampLike

  // 1) Timestamp 유사체(다른 SDK 포함): toMillis()로 환산 후 RN Timestamp로 재생성
  try {
    if (typeof timestampLike.toMillis === 'function') {
      const ms = timestampLike.toMillis()
      if (Number.isFinite(ms)) return Timestamp.fromMillis(ms)
    }
  } catch (error) {
    console.warn('Failed to normalize timestamp with toMillis', error)
  }

  // 2) {seconds, nanoseconds} / {_seconds, _nanoseconds}
  {
    const sRaw = timestampLike.seconds ?? timestampLike._seconds
    const nsRaw = timestampLike.nanoseconds ?? timestampLike._nanoseconds
    const s = typeof sRaw === 'string' ? Number.parseInt(sRaw, 10) : sRaw
    const ns = typeof nsRaw === 'string' ? Number.parseInt(nsRaw, 10) : nsRaw
    if (Number.isFinite(s) && Number.isFinite(ns)) {
      return new Timestamp(Number(s), Number(ns))
    }
  }

  // 3) number (ms | sec)
  if (typeof v === 'number') {
    const ms = v > 1e12 ? v : Math.floor(v * 1000)
    return Timestamp.fromMillis(ms)
  }

  // 4) Date
  if (v instanceof Date) return Timestamp.fromDate(v)

  // 5) string: "FirestoreTimestamp(seconds=..., nanoseconds=...)" | ISO
  if (typeof v === 'string') {
    const m = v.match(/seconds\s*=\s*(\d+).+nanoseconds\s*=\s*(\d+)/i)
    if (m) {
      return new Timestamp(Number(m[1]), Number(m[2]))
    }
    const t = Date.parse(v)
    if (!Number.isNaN(t)) return Timestamp.fromMillis(t)
  }

  return null
}
// 신규 유저인지 판별 (시간 차이가 1~2초 이내면 신규로 간주)
export const isNewUser = (user: FirebaseAuthTypes.User) => {
  const {creationTime, lastSignInTime} = user.metadata
  console.log(creationTime, lastSignInTime)
  if (!creationTime || !lastSignInTime) return false

  // 문자열 비교가 가장 간단하지만, 확실하게 하려면 Date 객체로 변환하여 차이 계산
  return new Date(creationTime).getTime() === new Date(lastSignInTime).getTime()
}
