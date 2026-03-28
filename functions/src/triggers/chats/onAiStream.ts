import * as logger from 'firebase-functions/logger'
import {onRequest} from 'firebase-functions/v2/https'
import {OpenAI} from 'openai'
import {updateAiResponse} from '../../services/aiChatService'
import {
  getAiResponseStream,
  getPandibotMessages,
  getPandibotTools,
} from '../../services/aiService'

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

      // AI 응답 도구 및 메시지 설정 (공통 서비스 활용)
      const tools = getPandibotTools()
      const messages = getPandibotMessages(prompt)

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

      // 4. 스트림 완료 후 Firestore 업데이트 및 푸시 알림
      if (messageId && aiReplyText) {
        await updateAiResponse({
          chatId,
          messageId,
          text: aiReplyText,
        })
        logger.info(`✅ SSE 스트리밍 및 공통 서비스 업데이트 완료: ${chatId}`)
      }
    } catch (error) {
      logger.error('❌ SSE 스트리밍 에러', error)
      res.write(`data: ${JSON.stringify({error: 'Internal Server Error'})}\n\n`)
      res.end()
    }
  },
)
