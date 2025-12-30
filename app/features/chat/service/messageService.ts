import {messageLocal} from '@app/features/chat/data/messageLocal.sqlite'
import {messageRemote} from '@app/features/chat/data/messageRemote.firebase'
import {User} from '@app/shared/types/auth'
import type {ChatListItem, ChatMessage} from '@app/shared/types/chat'
import {
  toMillisFromServerTime,
  toRNFTimestamp,
} from '@app/shared/utils/firebase'

export type InputMessageParams = {
  text: string
  type: ChatMessage['type']
  imageUrl?: string
}

export type SendMessageParams = {
  roomInfo?: ChatListItem | null
  targetIds: string[]
  chatType: ChatListItem['type']
  message: InputMessageParams
  user: User | null
}

export const messageService = {
  //채팅방 메세지 조회
  getChatMessages: async (
    roomId: string,
    ms?: number, //sqlite가 읽어야하기 떄문에 클라이언트에선 ms로 관리.
    pageSize?: number,
  ) => {
    const ts = toRNFTimestamp(ms) //milisecond -> firestore timestamp
    const {items, nextPageParam, hasNext} = await messageRemote.getChatMessages(
      roomId,
      ts,
      pageSize ?? 20,
    )
    const reformed = items?.map(item => ({
      ...item,
      createdAt: toMillisFromServerTime(item?.createdAt) ?? Date.now(),
    }))
    return {items: reformed, nextPageParam, hasNext}
  },
  //채팅방 메세지 구독
  subscribeChatMessages: async (
    roomId: string | null | undefined,
    lastSeq: number | null | undefined,
    // lastCreatedAt?: number,
    callback: (messages: ChatMessage[]) => void,
  ) => {
    // 1. 방어 코드: roomId가 없으면 빈 해지 함수 반환
    if (!roomId) {
      console.warn('subscribeChatMessages: roomId is missing')
      return () => {}
    }

    const unsub = messageRemote.subscribeChatMessages(
      roomId,
      lastSeq,
      async newMessages => {
        if (newMessages.length === 0) return []
        try {
          //SQLite 저장 시도
          await messageLocal.saveMessagesToSQLite(roomId, newMessages)
          //정합성을 위해 sqlite에 등록이 되었을 경우 callback 호출,
          callback(newMessages)
        } catch (error) {
          console.error('subscribeChatMessages_error:', error)
        }
      },
    )

    return unsub
  },
  //최신 채팅과 동기화
  syncNewMessages: async (
    roomId: string,
    seq: number,
    pageSize?: number,
  ): Promise<ChatMessage[]> => {
    const newMessages = await messageRemote.getChatMessageBySeq(
      roomId,
      seq,
      pageSize,
    )

    if (newMessages.length === 0) return []
    await messageLocal.saveMessagesToSQLite(roomId, newMessages)
    return newMessages
  },
  //메세지 전송 (신규채팅생성)
  sendChatMessage: async ({
    roomInfo,
    targetIds,
    chatType,
    message,
    user,
  }: SendMessageParams) => {
    let fetchedRoomId = roomInfo?.id ?? null //roomInfo의 id값 존재여부를 통해 실제 채팅방이 존재하는지 확인함.
    // const user = auth.currentUser
    const trimmed = message.text?.trim() ?? '' // 공백 메시지 방지용
    if (!user?.uid) throw new Error('로그인 정보가 유효하지 않습니다.')
    if (message.type === 'text' && !trimmed)
      throw new Error('메시지를 입력해주세요.')
    if (message.type === 'image' && !message.imageUrl)
      throw new Error('이미지 업로드에 실패했습니다.')

    try {
      // 1) 채팅방 신규 생성(없으면)
      // if (!fetchedRoomId) {
      //   if (!targetIds?.length) throw new Error('대화 상대 정보가 없습니다.')
      //   const result = await chatService.createChatRoom({
      //     myId: user.uid,
      //     targetIds,
      //     type: chatType,
      //   })
      //   fetchedRoomId = result?.id ?? null
      // }

      if (!fetchedRoomId) return new Error('채팅방 정보가 없습니다.')

      const reformedMsg: Omit<ChatMessage, 'id' | 'createdAt'> = {
        ...message,
        text: message.type === 'text' ? trimmed : message.text,
        senderId: user.uid,
        senderName: user.displayName ?? '',
        senderPicURL: user.photoURL ?? '',
      }

      // 2) 전송
      await messageRemote.sendChatMessage(fetchedRoomId, reformedMsg)
      return fetchedRoomId
    } catch (e: any) {
      console.log(e)
      if (e?.code === 'permission-denied') {
        throw new Error('메시지를 보낼 권한이 없습니다.')
      }

      if (e?.code === 'unavailable') {
        throw new Error(
          '네트워크 상태가 불안정합니다. 잠시 후 다시 시도해주세요.',
        )
      }
      // 기타 에러
      throw new Error('메시지 전송에 실패했습니다. 다시 시도해주세요.')
    }
  },
}
