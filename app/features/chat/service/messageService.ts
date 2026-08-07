import {messageLocal} from '@app/features/chat/data/messageLocal.sqlite'
import {
  messageRemote,
  type SendChatMessageResult,
} from '@app/features/chat/data/messageRemote.firebase'
import type {ChatMessage} from '@app/shared/types/chat'
import {toMillisFromServerTime} from '@app/shared/utils/firebase'
import {logger} from '@app/shared/services/logger'

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
  /** 서버 메시지를 로컬 타입으로 정규화하고 terminal 상태를 SQLite에 반영합니다. */
  refreshChatMessage: async (roomId: string, messageId: string) => {
    if (!roomId || !messageId) return null

    const remoteMessage = await messageRemote.getChatMessageById(
      roomId,
      messageId,
    )
    if (!remoteMessage) return null

    const normalizedMessage: ChatMessage = {
      ...remoteMessage,
      createdAt:
        toMillisFromServerTime(remoteMessage.createdAt) ?? Date.now(),
      aiResponseExpiresAt:
        toMillisFromServerTime(remoteMessage.aiResponseExpiresAt) ?? undefined,
    }

    // 구독이 terminal 상태를 먼저 저장한 경우, 늦게 도착한 streaming
    // 재조회 결과로 SQLite 상태가 역행하지 않도록 terminal만 저장합니다.
    if (normalizedMessage.status !== 'streaming') {
      try {
        await messageLocal.saveMessagesToSQLite(roomId, [normalizedMessage])
      } catch (error) {
        logger.warn('[messageService] failed to persist refreshed message', {
          roomId,
          messageId,
          error,
        })
      }
    }

    return normalizedMessage
  },
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
    callback: (messages: ChatMessage[]) => void,
  ): Promise<() => void> => {
    if (!roomId) {
      logger.warn('subscribeChatMessages: roomId is missing')
      return Promise.resolve(() => {})
    }

    return startChatMessageSubscription(roomId, callback)
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

    logger.info(`🚀 [Sync] 동기화 시작 (${roomId}): Gap ${gap}개`)

    let messagesToSave: ChatMessage[] = []

    // 3. 갭 크기에 따른 전략적 대응
    if (gap > 100) {
      // 갭이 너무 크면 중간을 다 채우기보다 최신 50개만 가져와서 스택을 맞춤
      // TODO(면접관 피드백): 최신 50개만 가져올 경우, 그 이전의 950개 메시지는 로컬에서 영원히 누락(비어있는 상태)될 위험이 있습니다.
      // 사용자가 과거로 스크롤할 때 하단의 `hasGapInRange`와 맞물려 오프라인 캐시 정합성이 깨질 수 있습니다.
      // '이 구간은 비어있음'을 나타내는 더미(Tombstone) 메시지 삽입이나, 별도의 Cursor/Page 관리가 필요합니다.
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
  sendChatMessage: (params: SendMessageParams) => {
    return sendChatMessageWithRemote(params, messageRemote.sendChatMessage)
  },

  //실패 메세지 재시도 (서버에 동일 ID가 있으면 기존 seq 사용)
  retryChatMessage: (params: SendMessageParams) => {
    return sendChatMessageWithRemote(params, messageRemote.retryChatMessage)
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
      // TODO(면접관 피드백): 서버에서 '메시지 삭제' 기능 등으로 특정 seq가 물리적으로 지워진 경우,
      // (firstSeq - lastSeq) 계산은 영원히 데이터 개수와 일치하지 않게 됩니다.
      // 이 경우 사용자가 스크롤할 때마다 무한히 서버 API를 호출(Infinite Fetch Loop)하는 치명적인 버그가 발생할 수 있습니다.
      // 삭제된 메시지를 뜻하는 'Tombstone(묘비)' 상태를 설계에 포함시켜 seq 연속성 계산의 구멍을 메워야 합니다.
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
        logger.error('[getChatMessages] History fetch failed', e)
        return localMessages
      }
    }

    return localMessages
  },

  getChatMessage: async (roomId: string, messageId: string) => {
    if (!roomId || !messageId) return null
    return await messageLocal.getMessageById(roomId, messageId)
  },
}

type SendMessageRemote = (
  roomId: string,
  message: Omit<ChatMessage, 'createdAt'>,
) => Promise<SendChatMessageResult>

const sendChatMessageWithRemote = async (
  {roomId, message}: SendMessageParams,
  sendRemote: SendMessageRemote,
) => {
  const fetchedRoomId = roomId ?? ''
  const newMessageId = message.id ?? ''
  const trimmed = message.text?.trim() ?? ''

  if (message.type === 'text' && !trimmed) {
    throw new Error('메시지를 입력해주세요.')
  }
  if (
    message.type === 'image' &&
    !message.imageUrl &&
    !message.imageUrls?.length
  ) {
    throw new Error('이미지 업로드에 실패했습니다.')
  }
  if (!fetchedRoomId) throw new Error('채팅방 정보가 없습니다.')

  let isRemoteSucceeded = false

  try {
    // pending 영속화는 Service에서 한 번만 담당
    await messageLocal.saveMessagesToSQLite(fetchedRoomId, [
      {...message, status: 'pending'},
    ])

    const result = await sendRemote(fetchedRoomId, message)
    isRemoteSucceeded = true

    try {
      const updated = await messageLocal.markMessageAsSuccess(
        fetchedRoomId,
        newMessageId,
        result.seq,
      )
      if (!updated) {
        logger.warn('[messageService] success message not found in SQLite', {
          roomId: fetchedRoomId,
          messageId: newMessageId,
        })
      }
    } catch (localError) {
      // 서버 전송은 성공했으므로 로컬 갱신 실패가 전송 실패로 역행하지 않게 함
      logger.warn('[messageService] failed to persist send success', {
        roomId: fetchedRoomId,
        messageId: newMessageId,
        error: localError,
      })
    }

    return fetchedRoomId
  } catch (e: unknown) {
    if (!isRemoteSucceeded && newMessageId) {
      try {
        await messageLocal.markMessageAsFailedIfPending(
          fetchedRoomId,
          newMessageId,
        )
      } catch (localError) {
        logger.warn('[messageService] failed to persist send failure', {
          roomId: fetchedRoomId,
          messageId: newMessageId,
          error: localError,
        })
      }
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
    throw new Error('메시지 전송에 실패했습니다. 다시 시도해주세요.')
  }
}

const startChatMessageSubscription = async (
  roomId: string,
  callback: (messages: ChatMessage[]) => void,
) => {
  let lastSeq = 0

  try {
    lastSeq = await messageLocal.getMaxLocalSeq(roomId)
  } catch (error) {
    // 로컬 조회 실패가 실시간 구독 시작까지 막지 않도록 처음부터 구독
    logger.warn('[messageService] failed to read local lastSeq', {
      roomId,
      error,
    })
  }

  return messageRemote.subscribeChatMessages(
    roomId,
    lastSeq,
    newMessages => {
      if (newMessages.length === 0) return
      void persistSubscribedMessages(roomId, newMessages, callback)
    },
  )
}

const persistSubscribedMessages = async (
  roomId: string,
  messages: ChatMessage[],
  callback: (messages: ChatMessage[]) => void,
) => {
  try {
    await messageLocal.saveMessagesToSQLite(roomId, messages)
  } catch (error) {
    // 로컬 저장에 실패해도 수신 메시지는 현재 화면에 표시
    logger.warn('[messageService] failed to persist subscribed messages', {
      roomId,
      error,
    })
  }

  callback(messages)
}
