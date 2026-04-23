import * as logger from 'firebase-functions/logger'
import {onTaskDispatched} from 'firebase-functions/v2/tasks'
import {OpenAI} from 'openai'
import {db} from '../../core/firebase'
import {handleAiError, updateAiResponse} from '../../services/aiChatService'
import {
  getAiResponse,
  getPandibotMessages,
  getPandibotTools,
} from '../../services/aiService'

/**
 * 질문자가 10~15초 이내에 스트리밍을 시작하지 않았을 경우,
 * 서버가 대신 답변을 생성하여 Firestore에 저장합니다.
 */
//Cloud Tasks 큐(Queue) 와 트리거가 연결된 함수
export const onAiStreamBackup = onTaskDispatched(
  {
    retryConfig: {
      maxAttempts: 3,
      minBackoffSeconds: 15,
    },
    secrets: ['OPENAI_API_SECRET', 'SERPER_API_SECRET'],
    region: 'asia-northeast3',
  },
  async event => {
    const {chatId, messageId, prompt, imageUrl, imageUrls} = event.data as {
      chatId: string
      messageId: string
      prompt: string
      imageUrl?: string
      imageUrls?: string[]
    }

    // 큐에서 작업이 시작되었음을 가장 먼저 로깅으로 확인
    logger.info(
      `[onAiStreamBackup] 🕒 백업 태스크 큐 실행 시작: [chatId=${chatId}] messageId=${messageId}`,
    )

    try {
      // 1. 메시지 현재 상태 확인
      const messageRef = db.doc(`chats/${chatId}/messages/${messageId}`)
      const messageSnap = await messageRef.get()

      if (!messageSnap.exists) return

      const messageData = messageSnap.data()
      const currentStatus = messageData?.status || 'unknown'

      // 이미 성공했거나 실패 처리되었다면 종료
      if (
        messageData?.status === 'success' ||
        messageData?.status === 'failed'
      ) {
        logger.info(
          `[onAiStreamBackup] ✅ Already completed: ${messageId} (status=${currentStatus})`,
        )
        return
      }

      // 🚨 가시성 및 필터링을 위한 로그 강화: SSE가 완료되지 않아 백업이 개입하는 시점
      logger.warn(
        `[onAiStreamBackup][REWRITE_TRIGGERED] ⚠️ SSE 미완료로 인한 강제 쓰기 시작 | messageData: ${messageData} | messageId: ${messageId} | chatId: ${chatId}`,
      )

      // 2. AI 답변 생성 (Full Text)
      const openai = new OpenAI({apiKey: process.env.OPENAI_API_SECRET})

      // AI 응답 도구 및 메시지 설정 (공통 서비스 활용)
      const tools = getPandibotTools()
      const messages = getPandibotMessages(prompt, [], imageUrl, imageUrls)

      const aiReplyText = await getAiResponse(
        openai,
        messages,
        tools,
        process.env.SERPER_API_SECRET || '',
      )

      if (!aiReplyText) {
        throw new Error('AI 응답 생성 실패')
      }

      // 3. Firestore 업데이트 및 푸시 알림 (공통 서비스 활용)
      await updateAiResponse({
        chatId,
        messageId,
        text: aiReplyText,
      })

      logger.info(
        `[onAiStreamBackup][REWRITE_COMPLETED] ✅ 백업으로 답변 생성 및 업데이트 완료: ${messageId}`,
      )
    } catch (err: any) {
      logger.error(`[onAiStreamBackup] Error:`, err)

      // 에러 시 상태 변경
      if (chatId && messageId) {
        await handleAiError({chatId, messageId, error: err})
      }

      // 에러 시 재시도하도록 throw (단, 3회 시도 후엔 종료됨)
      throw err
    }
  },
)
