import {FirebaseFirestoreTypes} from '@react-native-firebase/firestore'
import {FieldValue} from 'firebase-admin/firestore'

export type FsSnapshot =
  FirebaseFirestoreTypes.QueryDocumentSnapshot<FirebaseFirestoreTypes.DocumentData>

export type UpdateInput<T extends object> = {
  [K in keyof T]?: T[K] | FieldValue | string
}
