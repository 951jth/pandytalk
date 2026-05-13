import * as logger from 'firebase-functions/logger'
import {onDocumentCreated} from 'firebase-functions/v2/firestore'
import {performance} from 'perf_hooks'
import {db, messaging} from '../../core/firebase'
import {sendPushToChatMembers} from '../../utils/fcm'

export const sendNewMessageNotification = onDocumentCreated(
  {
    region: 'asia-northeast3',
    document: 'chats/{chatId}/messages/{messageId}',
  },
  async event => {
    const startTime = performance.now()

    try {
      const message = event.data?.data()
      const chatId = event.params.chatId as string
      if (!message || !chatId) {
        logger.info('⚠️ message or chatId 누락')
        return
      }

      const senderId: string = message.senderId
      if (!senderId) return
      const text: string = message.text || ''

      // skipPush 플래그가 있거나 특정 시스템 메시지인 경우 푸시 생략
      // 또한 AI 멘션(@팬디)인 경우에도 AI 답변 푸시와 중복되므로 생략
      if (
        message.skipPush === true ||
        text === '팬디봇이 입력 중입니다...' ||
        text.includes('@팬디')
      ) {
        logger.info(`ℹ️ 푸시 생략 (skipPush/시스템/AI멘션): ${chatId}`)
        return
      }

      // 공통 함수 호출하여 푸시 전송
      await sendPushToChatMembers(db, messaging, chatId, {
        id: event.data!.id,
        chatId,
        text,
        type: message.type ?? '',
        senderId,
        senderName: message.senderName ?? '',
        senderPicURL: message.senderPicURL ?? '',
        imageUrl: message.imageUrl ?? '',
        createdAt: message.createdAt,
        seq: message.seq,
      })

      // 최종 성능 로그
      const totalTime = performance.now() - startTime
      logger.info(`🚀 Push Notification Triggered`, {
        chatId,
        total_ms: totalTime,
      })
    } catch (e) {
      logger.error('푸시 오류', e as Error)
    }
  },
)
