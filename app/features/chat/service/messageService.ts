import {messageLocal} from '@app/features/chat/data/messageLocal.sqlite'
import {messageRemote} from '@app/features/chat/data/messageRemote.firebase'
import type {ChatMessage} from '@app/shared/types/chat'
import {toMillisFromServerTime} from '@app/shared/utils/firebase'

export type SendMessageParams = {
  roomId?: string
  message: ChatMessage
}

const getErrorCode = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  typeof error.code === 'string'
    ? error.code
    : undefined

export const messageService = {
  //채팅방 메세지 가져오기 By Seq(서버)
  getChatMessagesFromSeq: async (
    roomId: string,
    seq?: number,
    pageSize?: number,
  ) => {
    const {items, nextPageParam, hasNext} =
      await messageRemote.getChatMessagesBySeq(roomId, seq, pageSize ?? 20)
    const reformed = items?.map(item => ({
      ...item,
      createdAt: toMillisFromServerTime(item?.createdAt) ?? Date.now(),
    }))
    return {items: reformed, nextPageParam, hasNext}
  },

  //채팅방 메세지 구독
  subscribeChatMessages: (
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
        //SQLite 저장 시도
        await messageLocal.saveMessagesToSQLite(roomId, newMessages)
        callback(newMessages)
      },
    )
    return unsub
  },

  //최신 채팅과 동기화 (고도화된 버전)
  syncMessages: async (
    roomId: string,
    serverLastSeq: number,
  ): Promise<boolean> => {
    if (!roomId) return false

    // 1. 로컬 SQLite에서 최신 시퀀스 확인
    const localLastSeq = await messageLocal.getMaxLocalSeq(roomId)

    // 2. 서버와 로컬의 차이(Gap) 계산
    const gap = serverLastSeq - localLastSeq
    if (gap <= 0) return false // 이미 최신 상태

    console.log(`🚀 [Sync] 동기화 시작 (${roomId}): Gap ${gap}개`)

    let messagesToSave: ChatMessage[] = []

    // 3. 갭 크기에 따른 전략적 대응
    if (gap > 100) {
      // 갭이 너무 크면 중간을 다 채우기보다 최신 50개만 가져와서 스택을 맞춤
      const {items} = await messageService.getChatMessagesFromSeq(
        roomId,
        undefined,
        50,
      )
      messagesToSave = items
    } else {
      // 갭이 적당하면 누락된 전체 메시지 fetch (limit 100 적용됨)
      messagesToSave = await messageRemote.getAllChatMessagesFromSeq(
        roomId,
        localLastSeq,
      )
    }

    // 4. SQLite 저장
    if (messagesToSave.length > 0) {
      await messageLocal.saveMessagesToSQLite(roomId, messagesToSave)
      return true
    }

    return false
  },

  // (기존 syncNewMessages는 하위 호환성을 위해 유지하거나 제거 가능)
  syncNewMessages: async (
    roomId: string,
    seq: number,
    pageSize?: number,
  ): Promise<ChatMessage[]> => {
    const newMessages = await messageRemote.getAllChatMessagesFromSeq(
      roomId,
      seq,
    )

    if (newMessages.length === 0) return []
    await messageLocal.saveMessagesToSQLite(roomId, newMessages)
    //데이터 정합성을 위해 save이후에 sqlite를 바라보고 데이터를 가져옴
    const messages = await messageLocal.getChatMessagesBySeq(
      roomId,
      seq,
      pageSize,
    )
    return messages
  },

  //메세지 전송 (신규채팅생성)
  sendChatMessage: async ({roomId, message}: SendMessageParams) => {
    const fetchedRoomId: string = roomId ?? ''
    const newMessageId: string = message?.id ?? ''
    const trimmed = message.text?.trim() ?? ''
    if (message.type === 'text' && !trimmed)
      throw new Error('메시지를 입력해주세요.')
    if (
      message.type === 'image' &&
      !message.imageUrl &&
      !message.imageUrls?.length
    )
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
    } catch (e: unknown) {
      //SQLite에 실패상태로 저장
      if (fetchedRoomId && newMessageId) {
        messageLocal.updateMessageStatus(fetchedRoomId, newMessageId, 'failed')
      }
      const errorCode = getErrorCode(e)
      if (errorCode === 'permission-denied') {
        throw new Error('메시지를 보낼 권한이 없습니다.')
      }

      if (errorCode === 'unavailable') {
        throw new Error(
          '네트워크 상태가 불안정합니다. 잠시 후 다시 시도해주세요.',
        )
      }
      // 기타 에러
      throw new Error('메시지 전송에 실패했습니다. 다시 시도해주세요.')
    }
  },

  /**
   * 채팅 메시지 통합 조회 (Local-First + History Fetch)
   * 최신 메시지 동기화(Sync)는 전용 함수로 분리되었으므로,
   * 여기서는 로컬 조회와 과거 스크롤 시의 서버 조충만 담당함.
   */
  getChatMessages: async (
    roomId: string,
    cursorSeq?: number,
    pageSize: number = 20,
  ) => {
    // 1. 로컬 SQLite에서 먼저 조회
    const localMessages = (await messageLocal.getChatMessagesBySeq(
      roomId,
      cursorSeq,
      pageSize,
    )) as ChatMessage[]

    // 2. 서버 데이터 보충이 필요한지 판단 (과거 데이터 스크롤 시)
    // - 데이터 개수가 부족하거나
    // - 내부 시퀀스에 간극(Gap)이 있거나
    // - 커서 시작점에 데이터가 없는 경우

    let hasGapInRange = false
    if (localMessages.length > 1) {
      const firstSeq = localMessages[0].seq || 0
      const lastSeq = localMessages[localMessages.length - 1].seq || 0
      if (firstSeq - lastSeq !== localMessages.length - 1) {
        hasGapInRange = true
      }
    }

    const hasCursorGap =
      cursorSeq !== undefined &&
      (localMessages.length === 0 ||
        (localMessages[0]?.seq || 0) < cursorSeq - 1)

    const shouldFetchFromServer =
      (localMessages?.length || 0) < pageSize || hasGapInRange || hasCursorGap

    if (shouldFetchFromServer) {
      try {
        const {items: serverMessages} =
          await messageService.getChatMessagesFromSeq(
            roomId,
            cursorSeq,
            pageSize,
          )

        if (serverMessages?.length > 0) {
          await messageLocal.saveMessagesToSQLite(roomId, serverMessages)
          return await messageLocal.getChatMessagesBySeq(
            roomId,
            cursorSeq,
            pageSize,
          )
        }
      } catch (e) {
        console.error('[getChatMessages] History fetch failed', e)
        return localMessages
      }
    }

    return localMessages
  },
}
