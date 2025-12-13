import {
  FirebaseFirestoreTypes,
  Timestamp,
} from '@react-native-firebase/firestore'
import dayjs from 'dayjs'
import type {ChatListItem, ServerTime} from '../types/chat'

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

export function convertTimestampsToMillis<T = any>(obj: T): T {
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
    const result: Record<string, any> = {}
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

  const anyV = v as any

  // Firestore Timestamp 인스턴스
  if (typeof anyV?.toMillis === 'function') {
    try {
      return anyV.toMillis()
    } catch {}
  }
  if (typeof anyV?.toDate === 'function') {
    try {
      const d = anyV.toDate()
      if (d instanceof Date) return d.getTime()
    } catch {}
  }

  // {seconds, nanoseconds} 또는 {_seconds, _nanoseconds}
  {
    const s = anyV?.seconds ?? anyV?._seconds
    const ns = anyV?.nanoseconds ?? anyV?._nanoseconds ?? 0
    const sNum = typeof s === 'string' ? Number.parseInt(s, 10) : s
    const nsNum = typeof ns === 'string' ? Number.parseInt(ns, 10) : ns

    if (Number.isFinite(sNum) && Number.isFinite(nsNum)) {
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

/** '오전 3:45' 형태로 포맷 (serverTimestamp 미확정이면 '') */
export const formatChatTime = (
  timestamp: ServerTime | number | null | undefined,
): string => {
  const ms = toMillisFromServerTime(timestamp)
  if (ms == null) return ''
  const d = dayjs(ms)
  const period = d.hour() < 12 ? '오전' : '오후'
  const hhmm = d.format('h:mm')
  return `${period} ${hhmm}`
}

export function sortKey(item: ChatListItem): number {
  // lastMessageAt을 쓰는 경우(권장) 여기에 넣어두면 됨.
  const lmAt = (item as any).lastMessageAt // 선택 필드라 any로 접근
  return toMillis(lmAt ?? item.lastMessage?.createdAt ?? item.createdAt)
}

/** 서버타임스탬프를 원하는 포맷으로 ('YYYY년 MM월 DD일 dddd') */
export const formatServerDate = (
  ts: ServerTime | number | null | undefined,
  fmt = 'YYYY년 MM월 DD일 dddd',
): string => {
  let ms = typeof ts == 'number' ? ts : toMillisFromServerTime(ts)
  if (ms == null) return '' // 미확정이면 빈 문자열
  return dayjs(ms).format(fmt)
}

// any → RNFirebase Timestamp 로 정규화
export const toRNFTimestamp = (
  v: any,
): FirebaseFirestoreTypes.Timestamp | null => {
  if (v == null) return null

  // 1) Timestamp 유사체(다른 SDK 포함): toMillis()로 환산 후 RN Timestamp로 재생성
  try {
    if (typeof v?.toMillis === 'function') {
      const ms = v.toMillis()
      if (Number.isFinite(ms)) return Timestamp.fromMillis(ms)
    }
  } catch {}

  // 2) {seconds, nanoseconds} / {_seconds, _nanoseconds}
  {
    const sRaw = v?.seconds ?? v?._seconds
    const nsRaw = v?.nanoseconds ?? v?._nanoseconds
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
