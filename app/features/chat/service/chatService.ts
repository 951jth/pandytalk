import {
  chatRemote,
  SubscribeMyChatsParams,
  type GetMyChatsParams,
} from '@app/features/chat/data/chatRemote.firebase'
import {userService} from '@app/features/user/service/userService'
import type {ChatListItem} from '@app/shared/types/chat'
import {getUnreadCount} from '@app/shared/utils/chat'
import {
  FirebaseFirestoreTypes,
  serverTimestamp,
} from '@react-native-firebase/firestore'

export type CreateChatRoomOptions = {
  myId: string
  targetIds: string[] // DM이면 1명, 그룹이면 N명
  name?: string
  image?: string
  type?: ChatListItem['type'] // 명시 안 하면 members 길이로 dm/group 자동 판별
}

export type ensureChatRoomParams = {
  roomId: string
  payload: Omit<ChatListItem, 'id'>
}

export const chatService = {
  getMyChats: async ({userId, type, pageParam, pageSize}: GetMyChatsParams) => {
    const {items, nextPageParam, hasNext} = await chatRemote.getMyChats({
      userId,
      type,
      pageParam,
      pageSize,
    })

    const chats = items?.map(item => ({
      ...item,
      unreadCount: getUnreadCount(item, userId),
    }))
    return {
      chats,
      lastVisible: nextPageParam,
      isLastPage: !hasNext,
    }
  },
  subscribeMyChats: (
    {uid, type, pageSize}: SubscribeMyChatsParams,
    callback: (changes: FirebaseFirestoreTypes.DocumentChange[]) => void,
  ) => {
    const unsub = chatRemote.subscribeMyChats({uid, type, pageSize}, callback)
    //구독해체 함수 리턴
    return unsub
  },
  createChatRoom: async (options: CreateChatRoomOptions) => {
    const {myId, targetIds, name, image} = options
    // ✅ 멤버 아이디 정리 (현재 유저 + 타겟들)
    const memberIds = [myId, ...targetIds].filter(Boolean)
    const sortedIds = Array.from(new Set(memberIds)).sort() // 중복 제거 + 정렬
    const dmRoomId = `${sortedIds[0]}_${sortedIds[1]}`

    // ✅ 타입 자동 판별 (명시된 type이 있으면 우선)
    const type: ChatListItem['type'] =
      options.type ?? (sortedIds.length > 2 ? 'group' : 'dm')

    const baseRoom: Omit<ChatListItem, 'id'> = {
      type,
      createdAt: serverTimestamp(),
      members: sortedIds,
      name: name ?? '',
      image: image ?? '',
      lastMessageAt: serverTimestamp(),
    }
    const chatRoomRes = await chatRemote.createChatRoom(
      baseRoom,
      type == 'dm' ? dmRoomId : undefined, //그룹채팅은 autoId
    )
    return chatRoomRes
  },
  getChatRoom: async (roomId: string) => {
    let chatRoom = await chatRemote.getChatRoomById(roomId)
    return chatRoom
  },
  getChatRoomWithMemberInfo: async (roomId: string) => {
    let chatRoom = await chatRemote.getChatRoomById(roomId)
    const uids = chatRoom?.members ?? []
    if (chatRoom && uids?.length > 0) {
      chatRoom.memberInfos = (await userService.getUsersByIds(uids)) ?? []
    }
    return chatRoom
  },
  //채팅방 생성을 보증하는 함수임.
  ensureChatRoom: async ({roomId, payload}: ensureChatRoomParams) => {
    if (!roomId) throw new Error('roomId가 유효하지 않습니다.')

    // 1) 존재 확인
    const existId = await chatRemote.checkChatRoomExist(roomId)
    if (existId) return existId

    // 2) 없으면 생성 (고정 roomId로)
    const created = await chatRemote.createChatRoom(payload, roomId)
    return created.id // === roomId
  },
  subscribeChatRoom: (
    roomId: string,
    callback: (chatRoom: ChatListItem) => void,
  ) => {
    if (!roomId) return () => {}
    const unsub = chatRemote.subscribeChatRoom(roomId, callback)
    return unsub
  },
}
