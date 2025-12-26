import {firebaseCall} from '@app/shared/firebase/firebaseUtils'
import {firestore} from '@app/shared/firebase/firestore'
import type {ChatListItem} from '@app/shared/types/chat'
import type {FsSnapshot} from '@app/shared/types/firebase'
import {
  collection,
  FirebaseFirestoreTypes,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  where,
} from '@react-native-firebase/firestore'

export type GetMyChatsParams = {
  userId: string
  type: ChatListItem['type']
  pageParam?: FsSnapshot
  pageSize?: number
}

export type SubscribeMyChatsParams = {
  uid: string
  type: ChatListItem['type']
  pageSize?: number
}

export const chatRemote = {
  //채팅방 조회
  getMyChats: ({userId, type, pageParam, pageSize}: GetMyChatsParams) => {
    const PAGE_SIZE = pageSize ?? 20
    return firebaseCall('chatRemote.getMyChats', async () => {
      const chatsRef = collection(firestore, 'chats')
      // 최신 메시지 기준 정렬 + 생성일 보조 정렬 (기존과 동일)
      let q = query(
        chatsRef,
        where('members', 'array-contains', userId),
        where('type', '==', type),
        orderBy('lastMessageAt', 'desc'),
        limit(PAGE_SIZE),
      )

      if (pageParam) {
        // 여러 orderBy가 있어도 snapshot 커서 하나로 OK
        q = query(q, startAfter(pageParam))
      }

      const snapshot = await getDocs(q)
      return snapshot?.docs ?? []
    })
  },
  //채팅방 구독 (첫 페이지만)
  subscribeMyChats: (
    {uid, type, pageSize}: SubscribeMyChatsParams,
    callback: (changes: FirebaseFirestoreTypes.DocumentChange[]) => void,
  ) => {
    const chatsRef = collection(firestore, 'chats')
    const q = query(
      chatsRef,
      where('type', '==', type),
      where('members', 'array-contains', uid),
      orderBy('lastMessageAt', 'desc'),
      limit(pageSize ?? 20),
    )
    const unsub = onSnapshot(
      q,
      snap => {
        const changes = snap.docChanges()
        callback(changes)
      },
      error => {
        console.error('[chat head snapshot] error:', error)
      },
    )
    return unsub
  },
}
