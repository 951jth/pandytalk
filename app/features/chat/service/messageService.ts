import {messageLocal} from '@app/features/chat/data/messageLocal.sqlite'
import {messageRemote} from '@app/features/chat/data/messageRemote.firebase'
import type {ChatMessage} from '@app/shared/types/chat'
import {toMillisFromServerTime} from '@app/shared/utils/firebase'

export type SendMessageParams = {
  roomId?: string
  message: ChatMessage
}

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

  //최신 채팅과 동기화
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

  /**
   * 채팅 메시지를 통합 조회하는 로직 (Local-First + Sync)
   */
  getChatMessages: async (
    roomId: string,
    cursorSeq?: number,
    pageSize: number = 20,
    serverLastSeq?: number,
  ) => {
    // 1. 로컬 SQLite에서 먼저 조회
    const localMessages = (await messageLocal.getChatMessagesBySeq(
      roomId,
      cursorSeq,
      pageSize,
    )) as ChatMessage[]

    // 2. 서버 데이터와 비교하여 동기화가 필요한지 판단
    // (1) 첫 페이지 조회 시: 로컬 최신 데이터가 서버 최신보다 낮으면 Stale
    const isLocalStale =
      !cursorSeq &&
      serverLastSeq !== undefined &&
      (localMessages[0]?.seq ?? 0) < serverLastSeq

    // (2) 데이터 연속성 검증 (배열 내의 seq 번호들이 하나라도 비어있는지 체크)
    let hasGapInRange = false
    if (localMessages.length > 1) {
      const firstSeq = localMessages[0].seq || 0
      const lastSeq = localMessages[localMessages.length - 1].seq || 0
      // DESC 정렬이므로 (첫 번호 - 마지막 번호)가 (길이 - 1)과 같아야 연속적임
      if (firstSeq - lastSeq !== localMessages.length - 1) {
        hasGapInRange = true
      }
    }

    // (3) 커서(cursorSeq)와 조회된 첫 데이터 사이의 간극 체크
    const hasCursorGap =
      cursorSeq !== undefined &&
      (localMessages.length === 0 ||
        (localMessages[0]?.seq || 0) < cursorSeq - 1)

    // (4) 데이터 개수가 부족하거나, Stale하거나, 내부에 Gap이 있거나, 커서와 차이가 나면 서버 호출
    const shouldFetchFromServer =
      (localMessages?.length || 0) < pageSize ||
      isLocalStale ||
      hasGapInRange ||
      hasCursorGap

    if (__DEV__ && shouldFetchFromServer) {
      const reasons = [
        isLocalStale && '로컬 최신화 필요(Stale)',
        hasGapInRange && '중간 데이터 누락(Gap)',
        hasCursorGap && '커서 시작점 누락',
        (localMessages?.length || 0) < pageSize && '데이터 개수 부족',
      ].filter(Boolean)

      console.log(`[messageService] 🚀 서버 조회 시도 (${roomId}):`, {
        reasons,
        localRange: `${localMessages[localMessages.length - 1]?.seq ?? 0} ~ ${localMessages[0]?.seq ?? 0}`,
        serverLast: serverLastSeq,
        cursor: cursorSeq,
      })
    }

    if (shouldFetchFromServer) {
      try {
        // 서버에서 데이터 가져오기 (reformat된 데이터 반환)
        const {items: serverMessages} =
          await messageService.getChatMessagesFromSeq(
            roomId,
            cursorSeq,
            pageSize,
          )

        if (serverMessages?.length > 0) {
          // 서버 데이터를 SQLite에 저장 (INSERT OR REPLACE)
          await messageLocal.saveMessagesToSQLite(roomId, serverMessages)
        }

        // 저장 후 가장 정확한 상태인 SQLite에서 다시 조회하여 반환
        const updatedMessages = await messageLocal.getChatMessagesBySeq(
          roomId,
          cursorSeq,
          pageSize,
        )
        return updatedMessages
      } catch (e) {
        console.error(
          '[getChatMessages] Server fetch failed, fallback to local',
          e,
        )
        return localMessages
      }
    }

    return localMessages
  },
}
