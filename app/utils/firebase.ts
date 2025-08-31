import {
  FirebaseFirestoreTypes,
  Timestamp,
} from '@react-native-firebase/firestore'

// Timestamp/number → ms number 로 통일
export const toMillis = (
  v: number | FirebaseFirestoreTypes.Timestamp | undefined | null,
): number => {
  if (typeof v === 'number') return v
  if (v && typeof v.toMillis === 'function') return v.toMillis()
  return 0
}
// ms number → Firestore Timestamp
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
