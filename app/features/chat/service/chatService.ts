import {
  chatRemote,
  SubscribeMyChatsParams,
  type GetMyChatsParams,
} from '@app/features/chat/data/chatRemote.firebase'
import {messageRemote} from '@app/features/chat/data/messageRemote.firebase'
import type {ChatListItem, ChatMessage} from '@app/shared/types/chat'
import {getUnreadCount} from '@app/shared/utils/chat'
import {
  toMillisFromServerTime,
  toRNFTimestamp,
} from '@app/shared/utils/firebase'
import {FirebaseFirestoreTypes} from '@react-native-firebase/firestore'

export const chatService = {
  getMyChats: async ({userId, type, pageParam, pageSize}: GetMyChatsParams) => {
    const chatDocs = await chatRemote.getMyChats({
      userId,
      type,
      pageParam,
      pageSize,
    })
    const chats: ChatListItem[] = chatDocs.map((d: any) => {
      const data = d.data() as ChatListItem
      const unreadCount = getUnreadCount(data, userId) //현재 채팅의 seq와 각 유저의 seq 차이를 계산함
      return {
        id: d.id,
        name: data?.name,
        image: data?.image,
        type: data.type,
        createdAt: data.createdAt,
        lastMessage: data.lastMessage,
        lastSeq: data?.lastSeq ?? 0,
        members: data.members ?? [],
        lastReadSeqs: data.lastReadSeqs ?? undefined,
        lastReadTimestamps: data.lastReadTimestamps ?? undefined,
        unreadCount,
      }
    })
    return {
      chats,
      lastVisible: chatDocs[chatDocs?.length - 1] ?? null,
      isLastPage: chatDocs.length < (pageSize ?? 20),
    }
  },
  subscribeMyChats: (
    {uid, type, pageSize}: SubscribeMyChatsParams,
    callback: (changes: FirebaseFirestoreTypes.DocumentChange[]) => void,
  ) => {
    if (__DEV__) {
      console.group(`🔥 [SERVICE] chatRemote.subscribeMyChats`)
      console.log({uid, type, pageSize})
      console.groupEnd()
    }

    const unsub = chatRemote.subscribeMyChats({uid, type, pageSize}, callback)
    //구독해체 함수 리턴
    return unsub
  },
  getChatMessages: async (
    roomId: string,
    ms?: number, //sqlite가 읽어야하기 떄문에 클라이언트에선 ms로 관리.
    pageSize?: number,
  ) => {
    const ts = toRNFTimestamp(ms) //milisecond -> firestore timestamp
    const docs = await messageRemote.getChatMessages(roomId, ts, pageSize ?? 20)
    const messages = docs?.map(doc => {
      const data = {id: doc.id, ...doc.data()} as ChatMessage
      const reformedData: ChatMessage = {
        ...data,
        createdAt: toMillisFromServerTime(data?.createdAt) ?? Date.now(),
      } //클라이언트(sqlite)에서 보여질 데이터로 가공
      return reformedData
    })
    return messages
  },
}
