import * as admin from 'firebase-admin'
import * as logger from 'firebase-functions/logger'
import {onTaskDispatched} from 'firebase-functions/v2/tasks'
import {OpenAI} from 'openai'
import {AI_BASE_PROMPT, AI_BOT_ID, AI_BOT_NAME} from '../../constants/ai'
import {db, messaging} from '../../core/firebase'
import {getAiResponse} from '../../services/aiService'
import {sendPushToChatMembers} from '../../utils/fcm'

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
      if (messageData?.status === 'success' || messageData?.status === 'failed') {
        logger.info(`[onAiStreamBackup] Already completed: ${messageId}`)
        return
      }

      logger.info(`[onAiStreamBackup] Fallback starting for: ${messageId}`)

      // 2. AI 답변 생성 (Full Text)
      const openai = new OpenAI({apiKey: process.env.OPENAI_API_SECRET})
      const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
        {
          type: 'function',
          function: {
            name: 'search_web',
            description: '실시간 검색이 필요할 때 사용해',
            parameters: {
              type: 'object',
              properties: {
                query: {type: 'string'},
              },
              required: ['query'],
            },
          },
        },
      ]

      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {role: 'system', content: AI_BASE_PROMPT},
        {role: 'user', content: prompt},
      ]

      const aiReplyText = await getAiResponse(
        openai,
        messages,
        tools,
        process.env.SERPER_API_SECRET || '',
      )

      if (!aiReplyText) {
        throw new Error('AI 응답 생성 실패')
      }

      // 3. Firestore 업데이트
      const roomRef = db.doc(`chats/${chatId}`)
      const finalNow = admin.firestore.FieldValue.serverTimestamp()
      const finalMessage = {
        id: messageId,
        text: aiReplyText,
        senderId: AI_BOT_ID,
        senderName: AI_BOT_NAME,
        createdAt: finalNow,
        type: 'ai_text' as const,
        status: 'success' as const,
      }

      const batch = db.batch()
      batch.update(messageRef, {
        text: aiReplyText,
        createdAt: finalNow,
        status: 'success',
      })
      batch.update(roomRef, {
        lastMessage: finalMessage,
        lastMessageAt: finalNow,
      })

      await batch.commit()

      // 4. 푸시 알림 전송
      await sendPushToChatMembers(db, messaging, chatId, {
        id: messageId,
        chatId,
        text: aiReplyText,
        type: 'ai_text',
        senderId: AI_BOT_ID,
        senderName: AI_BOT_NAME,
        createdAt: Date.now(),
      })

      logger.info(`[onAiStreamBackup] Successfully completed fallback: ${messageId}`)
    } catch (err) {
      logger.error(`[onAiStreamBackup] Error:`, err)
      // 에러 시 재시도하도록 throw
      throw err
    }
  },
)
