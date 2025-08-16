import {FirebaseFirestoreTypes} from '@react-native-firebase/firestore'

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
