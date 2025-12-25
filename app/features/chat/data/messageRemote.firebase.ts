import {firebaseCall} from '@app/shared/firebase/firebaseCall'
import {firestore} from '@app/shared/firebase/firestore'
import {
  collection,
  getDocs,
  limit,
  query,
  where,
  type FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore'
import {orderBy} from 'lodash'

export const messageRemote = {
  getChatMessages: (
    roomId: string,
    ts?: FirebaseFirestoreTypes.Timestamp | null, //firebase 타임스탬프로 변환해서 보내야함.
    pageSize?: number,
  ) => {
    return firebaseCall('messageRemote.getChatMessages', async () => {
      const PAGE_SIZE = pageSize ?? 20
      const messagesRef = collection(firestore, 'chats', roomId, 'messages')
      let q = query(messagesRef, orderBy('createdAt', 'desc'), limit(PAGE_SIZE))
      if (ts) q = query(q, where('createdAt', '<', ts))
      const snapshot = await getDocs(q)
      return snapshot.docs
    })
  },
}
