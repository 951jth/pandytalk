import {FirebaseFirestoreTypes} from '@react-native-firebase/firestore'

export type FsSnapshot =
  FirebaseFirestoreTypes.QueryDocumentSnapshot<FirebaseFirestoreTypes.DocumentData>
