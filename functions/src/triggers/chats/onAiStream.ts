import * as admin from 'firebase-admin'
import * as logger from 'firebase-functions/logger'
import {onRequest} from 'firebase-functions/v2/https'
import {OpenAI} from 'openai'
import {AI_BASE_PROMPT, AI_BOT_ID, AI_BOT_NAME} from '../../constants/ai'
import {db, messaging} from '../../core/firebase'
import {getAiResponseStream} from '../../services/aiService'
import {sendPushToChatMembers} from '../../utils/fcm'

/**
 * HTTP SSE 스트리밍을 통해 AI 응답을 즉시 반환하고 Firestore에 저장하는 하이브리드 함수
 */
export const onAiStream = onRequest(
  {
    region: 'asia-northeast3',
    secrets: ['OPENAI_API_SECRET', 'SERPER_API_SECRET'],
    cors: true,
  },
  async (req, res) => {
    // SSE 헤더 설정
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    try {
      //prompt는 AI Mention에서 질문한 내용이 Prompt에 저장되어 있음
      const {chatId, prompt, messageId} = req.body

      if (!chatId || !prompt) {
        res.write(`data: ${JSON.stringify({error: 'Invalid parameters'})}\n\n`)
        res.end()
        return
      }

      const openai = new OpenAI({apiKey: process.env.OPENAI_API_SECRET})

      // AI 응답 도구 설정 (검색 기능 포함)
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

      // 시스템 프롬프트 업데이트
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: `${AI_BASE_PROMPT}`,
        },
        {role: 'user', content: prompt},
      ]

      const stream = await getAiResponseStream(
        openai,
        messages,
        tools,
        process.env.SERPER_API_SECRET || '',
      )

      let aiReplyText = ''
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || ''
        if (content) {
          aiReplyText += content
          // 클라이언트에 실시간 청크 전송
          res.write(`data: ${JSON.stringify({text: content})}\n\n`)
        }
      }

      // 스트림 종료 알림
      res.write('data: [DONE]\n\n')
      res.end()

      // 4. 스트림 완료 후 Firestore 업데이트 및 푸시 알림 (비동기 처리 가능하도록 res.end() 이후 수행)
      if (messageId && aiReplyText) {
        const roomRef = db.doc(`chats/${chatId}`)
        const aiMessageRef = roomRef.collection('messages').doc(messageId)
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
        batch.update(aiMessageRef, {
          text: aiReplyText,
          createdAt: finalNow,
          status: 'success',
        })
        batch.update(roomRef, {
          lastMessage: finalMessage,
          lastMessageAt: finalNow,
        })

        await batch.commit()

        // 푸시 알림 전송
        await sendPushToChatMembers(db, messaging, chatId, {
          id: messageId,
          chatId,
          text: aiReplyText,
          type: 'ai_text',
          senderId: AI_BOT_ID,
          senderName: AI_BOT_NAME,
          createdAt: Date.now(),
        })

        logger.info(`✅ SSE 스트리밍 및 Firestore 업데이트 완료: ${chatId}`)
      }
    } catch (error) {
      logger.error('❌ SSE 스트리밍 에러', error)
      res.write(`data: ${JSON.stringify({error: 'Internal Server Error'})}\n\n`)
      res.end()
    }
  },
)
