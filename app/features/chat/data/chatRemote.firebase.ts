import {
  firebaseCall,
  firebaseObserver,
  firebaseRefObserver,
} from '@app/shared/firebase/firebaseUtils'
import {firestore} from '@app/shared/firebase/firestore'
import {toPageResult} from '@app/shared/firebase/pagination'
import type {ChatRoom} from '@app/shared/types/chat'
import type {FsSnapshot} from '@app/shared/types/firebase'
import {
  collection,
  doc,
  FirebaseFirestoreTypes,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  startAfter,
  where,
} from '@react-native-firebase/firestore'

export type GetMyChatsParams = {
  userId: string
  type: ChatRoom['type']
  pageParam?: FsSnapshot
  pageSize?: number
}

export type SubscribeMyChatsParams = {
  uid: string
  type: ChatRoom['type']
  pageSize?: number
}

export const chatRemote = {
  //나의 채팅방들 조회
  getMyChats: ({userId, type, pageParam, pageSize}: GetMyChatsParams) => {
    return firebaseCall('chatRemote.getMyChats', async () => {
      const PAGE_SIZE = pageSize ?? 20
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
      const docs = snapshot.docs
      //이렇게 page변수로 만들고 리턴하는 것이 미리보기가가능
      const page = toPageResult(
        docs,
        PAGE_SIZE,
        d => ({id: d.id, ...d.data()}) as ChatRoom,
      )
      return page
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
    return firebaseObserver(
      'chatRemote.subscribeMyChats',
      q,
      snap => {
        const changes = snap.docChanges()
        callback(changes)
      },
      error => {
        console.error('[chat head snapshot] error:', error)
      },
    )
  },
  //채팅방 생성
  createChatRoom: (payload: Omit<ChatRoom, 'id'>, roomId?: string) => {
    return firebaseCall('chatRemote.createChatRoom', async () => {
      const chatRef = collection(firestore, 'chats')
      // roomId가 유효하면 해당 ID로, 없으면(falsy) Auto ID로 참조 생성
      const roomDocRef = roomId ? doc(chatRef, roomId) : doc(chatRef)
      await setDoc(roomDocRef, payload)
      return {
        id: roomDocRef.id,
        ...payload,
      } as ChatRoom
    })
  },
  //현재 채팅방이 있는지 id를 통해 조회 (채팅방 정보를 조회하는게 아님.)
  checkChatRoomExist: (roomId: string) => {
    return firebaseCall('chatRemote.checkChatRoomExist', async () => {
      const chatRef = collection(firestore, 'chats')
      const roomDocRef = doc(chatRef, roomId)
      const snap = await getDoc(roomDocRef)
      return snap.exists()
    })
  },
  //채팅방 정보 조회
  getChatRoomById: (roomId: string) => {
    return firebaseCall('chatRemote.getChatRoomById', async () => {
      const chatDocRef = doc(firestore, 'chats', roomId)
      const chatSnap = await getDoc(chatDocRef)
      //채팅방이없으면 오류 없이 null값만 보냄(있는지 조회만 함)
      if (!chatSnap.exists()) return null
      return {
        id: chatDocRef.id,
        ...(chatSnap.data() as Omit<ChatRoom, 'id'>),
      }
    })
  },
  subscribeChatRoom: (
    roomId: string,
    callback: (chatRoom: ChatRoom) => void,
  ) => {
    const chatRef = doc(firestore, 'chats', roomId)
    return firebaseRefObserver(
      'chatRemote.subscribeChatRoom',
      chatRef,
      snap => {
        const chatRoomData = snap.data() as ChatRoom
        callback(chatRoomData)
      },
      error => {
        console.error('[chat head snapshot] error:', error)
      },
    )
  },
}
