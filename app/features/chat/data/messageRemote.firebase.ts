import {firebaseCall} from '@app/shared/firebase/firebaseCall'
import {firestore} from '@app/shared/firebase/firestore'
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  type FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore'

export const messageRemote = {
  getChatMessages: (
    roomId: string,
    ts?: FirebaseFirestoreTypes.Timestamp | null, //firebase 타임스탬프로 변환해서 보내야함.
    pageSize?: number,
  ) => {
    return firebaseCall('messageRemote.getChatMessages', async () => {
      const PAGE_SIZE = pageSize ?? 20
      const messagesRef = collection(firestore, 'chats', roomId, 'messages')

      // 1. 기본 조건들을 배열에 담기
      const constraints = [orderBy('createdAt', 'desc'), limit(PAGE_SIZE)]
      // 2. ts가 있을 때만 조건 추가 (배열에 push)
      if (ts) {
        constraints.push(startAfter(ts))
      }
      // 3. query 함수 한번만 호출해서 완성 (...spread 연산자 사용)
      const q = query(messagesRef, ...constraints)
      console.log('q', q)
      const snapshot = await getDocs(q)
      return snapshot.docs
    })
  },
}
