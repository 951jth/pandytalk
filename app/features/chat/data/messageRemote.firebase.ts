import {firebaseCall} from '@app/shared/firebase/firebaseCall'
import {firestore} from '@app/shared/firebase/firestore'
import {toRNFTimestamp} from '@app/shared/utils/firebase'
import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  where,
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
      // 3. query 함수 한번만 호출해서 완성
      const q = query(messagesRef, ...constraints)
      const snapshot = await getDocs(q)
      return snapshot.docs
    })
  },
  subscribeChatMessages: (
    roomId: string,
    lastCreatedAt: number | null | undefined,
    callback: (docs: FirebaseFirestoreTypes.DocumentData[]) => void,
  ) => {
    // / 1. 방어 코드: roomId가 없으면 아무것도 하지 않는 '해지 함수'를 반환
    if (!roomId) return () => {}

    const ts = toRNFTimestamp(lastCreatedAt)
    const messagesRef = collection(firestore, 'chats', roomId, 'messages')

    // 2. 쿼리 빌딩: 가독성을 위해 단계별 구성
    let messageQuery = query(
      messagesRef,
      orderBy('createdAt', 'desc'),
      limit(50),
    )

    // lastCreatedAt이 유효할 때만 where 절 추가 (복합 인덱스 필요 가능성 있음)
    if (ts) messageQuery = query(messageQuery, where('createdAt', '>', ts))

    // 3. 리스너 연결
    const unsub = onSnapshot(messageQuery, snapshot => {
      // 굳이 async일 필요가 없으므로 제거 (내부에서 await를 쓰지 않는다면)
      callback(snapshot.docs)
    })

    return unsub
  },
}
