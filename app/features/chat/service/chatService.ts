import {
  chatRemote,
  SubscribeMyChatsParams,
  type GetMyChatsParams,
} from '@app/features/chat/data/chatRemote.firebase'
import type {ChatListItem} from '@app/shared/types/chat'
import {getUnreadCount} from '@app/shared/utils/chat'
import {FirebaseFirestoreTypes} from '@react-native-firebase/firestore'

export const chatService = {
  getMyChats: async ({userId, type, pageParam, pageSize}: GetMyChatsParams) => {
    const chatDocs = await chatRemote.getMyChats({
      userId,
      type,
      pageParam,
      pageSize,
    })
    const chats: ChatListItem[] = chatDocs.map(d => {
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
}
