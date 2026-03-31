import * as logger from 'firebase-functions/logger'
import {onRequest} from 'firebase-functions/v2/https'
import {OpenAI} from 'openai'
import {handleAiError, updateAiResponse} from '../../services/aiChatService'
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
    // 🔍 디버깅용 로그 추가
    logger.info('[onAiStream] Request Headers:', req.headers)
    logger.info('[onAiStream] Request Body:', req.body)

    // SSE 헤더 설정
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    // prompt는 AI Mention에서 질문한 내용
    const {chatId, prompt, messageId, createdAt} = req.body

    const controller = new AbortController()
    let aiReplyText = ''
    let isResponseSaved = false // 중복 저장 방지용 플래그

    // 클라이언트 연결 종료 감지
    req.on('close', () => {
      if (!res.writableEnded) {
        logger.info(`🔌 [onAiStream] Client disconnected: ${chatId}`)
        controller.abort()
      }
    })

    try {
      if (!chatId || !prompt) {
        logger.warn(
          `⚠️ 필수 파라미터 누락됨: chatId=${chatId}, prompt=${prompt ? '있음' : '없음'}`,
        )
        res.write(
          `data: ${JSON.stringify({error: 'Invalid parameters', received: req.body})}\n\n`,
        )
        res.end()
        return
      }

      const openai = new OpenAI({apiKey: process.env.OPENAI_API_SECRET})

      // AI 응답 도구 및 메시지 설정 (공통 서비스 활용)
      const tools = getPandibotTools()
      const messages = getPandibotMessages(prompt)

      // 스트리밍 응답 생성
      const stream = await getAiResponseStream(
        openai,
        messages,
        tools,
        process.env.SERPER_API_SECRET || '',
        controller.signal,
      )

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || ''
        if (content) {
          aiReplyText += content
          // 클라이언트가 끊겼을 때 write에서 에러가 발생하면 catch로 이동
          res.write(`data: ${JSON.stringify({text: content})}\n\n`)
        }
      }

      // 스트림 정상 종료 알림
      if (!res.writableEnded) {
        res.write('data: [DONE]\n\n')
      }
    } catch (error: any) {
      const isAbortError =
        error.name === 'AbortError' || error.code === 'ERR_CANCELED'
      if (isAbortError) {
        logger.info(`🔌 [onAiStream] Stream aborted: ${chatId}`)
      } else {
        logger.error('❌ SSE 스트리밍 에러', error)

        // 텍스트가 아예 생성되지 않은 상태에서 일반 에러가 발생한 경우에만 에러 핸들러 호출
        if (!aiReplyText && chatId && messageId && !isResponseSaved) {
          await handleAiError({chatId, messageId, error})
          isResponseSaved = true
        }

        if (!res.writableEnded) {
          res.write(
            `data: ${JSON.stringify({error: error.message || 'Internal Server Error'})}\n\n`,
          )
        }
      }
    } finally {
      // 1. 여기까지 생성된 텍스트가 있다면 저장 (성공/에러/중단 공통 처리)
      if (messageId && aiReplyText && !isResponseSaved) {
        try {
          await updateAiResponse({
            chatId,
            messageId,
            text: aiReplyText,
            createdAt,
          })
          isResponseSaved = true
          logger.info(`✅ [onAiStream] Response finalized and saved: ${chatId}`)
        } catch (saveError) {
          logger.error('❌ Final response save failed', saveError)
        }
      }

      // 2. 최종 응답 종료 보장
      if (!res.writableEnded) {
        res.end()
      }
    }
  },
)
