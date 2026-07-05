import {FirebaseFirestoreTypes} from '@react-native-firebase/firestore'

export type ServerTime =
  | FirebaseFirestoreTypes.FieldValue
  | FirebaseFirestoreTypes.Timestamp

export type FsSnapshot =
  FirebaseFirestoreTypes.QueryDocumentSnapshot<FirebaseFirestoreTypes.DocumentData>

export type UpdateInput<T extends object> = {
  [K in keyof T]?: T[K] | FirebaseFirestoreTypes.FieldValue | string
}

export type DocChange =
  FirebaseFirestoreTypes.DocumentChange<FirebaseFirestoreTypes.DocumentData>
