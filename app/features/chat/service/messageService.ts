import {messageLocal} from '@app/features/chat/data/messageLocal.sqlite'
import {messageRemote} from '@app/features/chat/data/messageRemote.firebase'
import type {ChatMessage} from '@app/shared/types/chat'
import {
  toMillisFromServerTime,
  toRNFTimestamp,
} from '@app/shared/utils/firebase'

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
      async docs => {
        // 데이터 매핑
        const newMessages = docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as ChatMessage[]

        if (newMessages.length === 0) return

        try {
          //SQLite 저장 시도
          await messageLocal.saveMessagesToSQLite(roomId, newMessages)
          //정합성을 위해 sqlite에 등록이 되었을 경우 callback 호출,
          callback(newMessages)
        } catch (error) {
          console.error('❌ Failed to save messages to SQLite:', error)
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
    const docs = await messageRemote.getChatMessageBySeq(roomId, seq, pageSize)
    const newMessages = docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ChatMessage[]

    if (newMessages.length === 0) return []
    //SQLite 저장 시도
    await messageLocal.saveMessagesToSQLite(roomId, newMessages)
    return newMessages
    //정합성을 위해 sqlite에 등록이 되었을 경우 callback 호출,
  },
}
