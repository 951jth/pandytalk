import * as logger from 'firebase-functions/logger'
import {onTaskDispatched} from 'firebase-functions/v2/tasks'
import {OpenAI} from 'openai'
import {db} from '../../core/firebase'
import {updateAiResponse} from '../../services/aiChatService'
import {
  getAiResponse,
  getPandibotMessages,
  getPandibotTools,
} from '../../services/aiService'

/**
 * 질문자가 10~15초 이내에 스트리밍을 시작하지 않았을 경우,
 * 서버가 대신 답변을 생성하여 Firestore에 저장합니다.
 */
export const onAiStreamBackup = onTaskDispatched(
  {
    retryConfig: {
      maxAttempts: 3,
      minBackoffSeconds: 60,
    },
    secrets: ['OPENAI_API_SECRET', 'SERPER_API_SECRET'],
    region: 'asia-northeast3',
  },
  async event => {
    const {chatId, messageId, prompt} = event.data as {
      chatId: string
      messageId: string
      prompt: string
    }

    try {
      // 1. 메시지 현재 상태 확인
      const messageRef = db.doc(`chats/${chatId}/messages/${messageId}`)
      const messageSnap = await messageRef.get()

      if (!messageSnap.exists) return

      const messageData = messageSnap.data()
      // 이미 성공했거나 실패 처리되었다면 종료
      if (
        messageData?.status === 'success' ||
        messageData?.status === 'failed'
      ) {
        logger.info(`[onAiStreamBackup] Already completed: ${messageId}`)
        return
      }

      logger.info(`[onAiStreamBackup] Fallback starting for: ${messageId}`)

      // 2. AI 답변 생성 (Full Text)
      const openai = new OpenAI({apiKey: process.env.OPENAI_API_SECRET})

      // AI 응답 도구 및 메시지 설정 (공통 서비스 활용)
      const tools = getPandibotTools()
      const messages = getPandibotMessages(prompt)

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
        `[onAiStreamBackup] Successfully completed fallback: ${messageId}`,
      )
    } catch (err) {
      logger.error(`[onAiStreamBackup] Error:`, err)
      // 에러 시 재시도하도록 throw
      throw err
    }
  },
)
