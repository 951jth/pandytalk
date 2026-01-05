import {messageLocal} from '@app/features/chat/data/messageLocal.sqlite'
import {messageRemote} from '@app/features/chat/data/messageRemote.firebase'
import type {ChatMessage} from '@app/shared/types/chat'
import {
  toMillisFromServerTime,
  toRNFTimestamp,
} from '@app/shared/utils/firebase'

export type SendMessageParams = {
  roomId?: string
  message: ChatMessage
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
    //데이터 정합성을 위해 save이후에 sqlite를 바라보고 데이터를 가져옴
    const messages = await messageLocal.getChatMessageBySeq(
      roomId,
      seq,
      pageSize,
    )
    return messages
  },
  //메세지 전송 (신규채팅생성)
  sendChatMessage: async ({roomId, message}: SendMessageParams) => {
    let fetchedRoomId: string = roomId ?? ''
    let newMessageId: string = message?.id ?? ''
    const trimmed = message.text?.trim() ?? ''
    if (message.type === 'text' && !trimmed)
      throw new Error('메시지를 입력해주세요.')
    if (message.type === 'image' && !message.imageUrl)
      throw new Error('이미지 업로드에 실패했습니다.')
    try {
      if (!fetchedRoomId) throw new Error('채팅방 정보가 없습니다.')
      await messageLocal.saveMessagesToSQLite(fetchedRoomId, [
        {...message, status: 'pending'},
      ])
      await messageRemote.sendChatMessage(fetchedRoomId, message)
      await messageLocal.updateMessageStatus(
        fetchedRoomId,
        newMessageId,
        'success',
      )

      return fetchedRoomId
    } catch (e: any) {
      //SQLite에 실패상태로 저장
      if (fetchedRoomId && newMessageId) {
        messageLocal.updateMessageStatus(fetchedRoomId, newMessageId, 'failed')
      }
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
