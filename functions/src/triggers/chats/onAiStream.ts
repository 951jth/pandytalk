import * as logger from 'firebase-functions/logger'
import {onRequest} from 'firebase-functions/v2/https'
import {OpenAI} from 'openai'
import {db} from '../../core/firebase'
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
    const {chatId, prompt, messageId, createdAt, imageUrl} = req.body

    const controller = new AbortController()
    let aiReplyText = ''
    let isResponseSaved = false // 중복 저장 방지용 플래그

    // 클라이언트 연결 종료 감지 (임시 주석 처리)
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

      // 🔍 채팅방 문서에서 캐싱된 맥락(recentMessages) 가져오기
      const chatDoc = await db.doc(`chats/${chatId}`).get()
      const chatData = chatDoc.data()
      const history = (chatData?.recentMessages as any[]) || []

      // 현재 질문(prompt)과 중복되는 히스토리는 제외 (가장 마지막 대화와 중복일 확률이 큼)
      const filteredHistory = history.filter(h => {
        // 단순 문자열인 경우
        if (typeof h.content === 'string') {
          return h.content !== prompt
        }
        // 객체 배열(멀티모달)인 경우 텍스트 부분만 비교
        if (Array.isArray(h.content)) {
          const textPart = h.content.find((p: any) => p.type === 'text')
          return textPart?.text !== prompt
        }
        return true
      })

      // AI 응답 도구 및 메시지 설정 (공통 서비스 활용)
      const tools = getPandibotTools()
      const messages = getPandibotMessages(prompt, filteredHistory, imageUrl)

      // 스트리밍 응답 생성
      const stream = await getAiResponseStream(
        openai,
        messages,
        tools,
        process.env.SERPER_API_SECRET || '',
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

        if (!res.writableEnded) {
          res.write(
            `data: ${JSON.stringify({
              error: error.message || 'Internal Server Error',
            })}\n\n`,
          )
        }
      }
    } finally {
      // 1. 결과 처리 및 상태 업데이트
      if (messageId && !isResponseSaved) {
        if (aiReplyText) {
          // 생성된 텍스트가 있다면 성공/일부 성공으로 저장
          try {
            await updateAiResponse({
              chatId,
              messageId,
              text: aiReplyText,
              createdAt,
            })
            isResponseSaved = true
            logger.info(
              `✅ [onAiStream] Response finalized and saved: ${chatId}`,
            )
          } catch (saveError) {
            logger.error('❌ Final response save failed', saveError)
          }
        } else {
          // 텍스트가 전혀 없는 상태에서 종료된 경우 (중단 포함)
          // 상태를 'failed'로 변경하여 클라이언트의 무한 재연결 루프 방지
          try {
            await handleAiError({
              chatId,
              messageId,
              error: new Error('No response generated before stream ended'),
            })
            isResponseSaved = true
            logger.info(
              `⚠️ [onAiStream] No text generated, status set to failed: ${chatId}`,
            )
          } catch (failError) {
            logger.error('❌ Failed to set error status', failError)
          }
        }
      }

      // 2. 최종 응답 종료 보장
      if (!res.writableEnded) {
        res.end()
      }
    }
  },
)
