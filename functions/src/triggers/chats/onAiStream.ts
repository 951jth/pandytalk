import {getAuth} from 'firebase-admin/auth'
import * as logger from 'firebase-functions/logger'
import {onRequest} from 'firebase-functions/v2/https'
import {OpenAI} from 'openai'
import {AI_BOT_ID} from '../../constants/ai'
import {db} from '../../core/firebase'
import {handleAiError, updateAiResponse} from '../../services/aiChatService'
import {
  getAiResponseStream,
  getPandibotMessages,
  getPandibotTools,
} from '../../services/aiService'
import {
  filterDuplicatePrompt,
  isAbortLikeError,
  isRecord,
  toAiRecentMessages,
  toErrorMessage,
} from '../../utils/aiUtils'

const toAiStreamLogTarget = (chatId?: string, messageId?: string) => {
  const resolvedChatId = chatId || 'unknown'
  const resolvedMessageId = messageId || 'unknown'

  return `${resolvedChatId} (messageId=${resolvedMessageId})`
}

const toStringValue = (value: unknown) =>
  typeof value === 'string' ? value : undefined

const toStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : undefined

const toBearerToken = (authorization?: string) => {
  if (!authorization?.startsWith('Bearer ')) return undefined
  return authorization.slice('Bearer '.length).trim()
}

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
    if (req.method !== 'POST') {
      res.status(405).json({error: 'POST 요청만 허용됩니다.'})
      return
    }

    const idToken = toBearerToken(req.headers.authorization)
    if (!idToken) {
      res.status(401).json({error: '인증 토큰이 필요합니다.'})
      return
    }

    let requesterUid: string
    try {
      requesterUid = (await getAuth().verifyIdToken(idToken)).uid
    } catch (error) {
      logger.warn('[onAiStream] Firebase ID token verification failed', error)
      res.status(401).json({error: '유효하지 않은 인증 토큰입니다.'})
      return
    }

    // SSE 헤더 설정
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    // prompt는 AI Mention에서 질문한 내용 (id는 messageId로 하위 호환성 유지)
    const body = isRecord(req.body) ? req.body : {}
    const chatId = toStringValue(body.chatId)
    const bodyMessageId = toStringValue(body.messageId)
    const bodyId = toStringValue(body.id)
    const messageId = bodyMessageId || bodyId

    logger.info(
      `🚀 [onAiStream] Stream requested: ${toAiStreamLogTarget(chatId, messageId)}`,
    )

    const controller = new AbortController()
    let aiReplyText = ''
    let isResponseSaved = false // 중복 저장 방지용 플래그

    res.on('close', () => {
      if (!res.writableEnded) {
        logger.info(
          `🔌 [onAiStream] Client disconnected: ${toAiStreamLogTarget(chatId, messageId)}`,
        )
        controller.abort()
      }
    })

    try {
      if (!chatId || !messageId) {
        logger.warn(
          `⚠️ 필수 파라미터 누락됨: chatId=${chatId}, messageId=${messageId}`,
        )
        res.write(`data: ${JSON.stringify({error: 'Invalid parameters'})}\n\n`)
        res.end()
        return
      }

      // 클라이언트 payload를 신뢰하지 않고 저장된 AI 메시지를 원본으로 사용합니다.
      const roomRef = db.doc(`chats/${chatId}`)
      const messageRef = roomRef.collection('messages').doc(messageId)
      const [messageSnap, chatDoc] = await db.getAll(messageRef, roomRef)
      const messageData = messageSnap.data()
      const chatData = chatDoc.data()

      if (
        !messageSnap.exists ||
        !chatDoc.exists ||
        !messageData ||
        !chatData ||
        messageData.senderId !== AI_BOT_ID
      ) {
        isResponseSaved = true
        res.write(
          `data: ${JSON.stringify({error: 'AI message not found'})}\n\n`,
        )
        res.end()
        return
      }

      const members = chatData?.members
      if (!Array.isArray(members) || !members.includes(requesterUid)) {
        isResponseSaved = true
        res.write(
          `data: ${JSON.stringify({error: '채팅방 접근 권한이 없습니다.'})}\n\n`,
        )
        res.end()
        return
      }

      if (messageData.mentionerId !== requesterUid) {
        isResponseSaved = true
        res.write(
          `data: ${JSON.stringify({error: 'AI 질문자만 스트림을 시작할 수 있습니다.'})}\n\n`,
        )
        res.end()
        return
      }

      if (messageData.status === 'success') {
        isResponseSaved = true
        res.write(
          `data: ${JSON.stringify({error: 'AI response already completed'})}\n\n`,
        )
        res.end()
        return
      }

      if (messageData.status !== 'streaming') {
        isResponseSaved = true
        res.write(
          `data: ${JSON.stringify({error: 'AI 스트림을 시작할 수 없는 상태입니다.'})}\n\n`,
        )
        res.end()
        return
      }

      const prompt = toStringValue(messageData.prompt) || ''
      const imageUrl = toStringValue(messageData.imageUrl)
      const imageUrls = toStringArray(messageData.imageUrls)

      if (!prompt && !imageUrl && !imageUrls?.length) {
        await handleAiError({
          chatId,
          messageId,
          error: new Error('AI 요청 내용이 없습니다.'),
        })
        isResponseSaved = true
        res.write(
          `data: ${JSON.stringify({error: 'AI request content is empty'})}\n\n`,
        )
        res.end()
        return
      }

      const openai = new OpenAI({apiKey: process.env.OPENAI_API_SECRET})

      // 🔍 채팅방 문서에서 캐싱된 맥락(recentMessages) 가져오기
      const history = toAiRecentMessages(chatData?.recentMessages)

      // 현재 질문(prompt)과 중복되는 히스토리는 제외 (가장 마지막 대화와 중복일 확률이 큼)
      const filteredHistory = filterDuplicatePrompt(history, prompt)

      // AI 응답 도구 및 메시지 설정 (공통 서비스 활용)
      const tools = getPandibotTools()
      const messages = getPandibotMessages(
        prompt,
        filteredHistory,
        imageUrl,
        imageUrls,
      )

      // 스트리밍 응답 생성
      const stream = await getAiResponseStream(
        openai,
        messages,
        tools,
        process.env.SERPER_API_SECRET || '',
      )
      logger.info(
        `✅ [onAiStream] OpenAI stream ready: ${toAiStreamLogTarget(chatId, messageId)}`,
      )

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || ''
        if (content) {
          aiReplyText += content
          // 클라이언트가 끊겼을 때 write에서 에러가 발생하면 catch로 이동
          res.write(`data: ${JSON.stringify({text: content})}\n\n`)
        }
      }

      logger.info(
        `✅ [onAiStream] Stream completed: ${toAiStreamLogTarget(chatId, messageId)}`,
      )

      // 스트림 정상 종료 알림
      if (!res.writableEnded) {
        res.write('data: [DONE]\n\n')
      }
    } catch (error) {
      if (isAbortLikeError(error)) {
        logger.info(
          `🔌 [onAiStream] Stream aborted: ${toAiStreamLogTarget(chatId, messageId)}`,
        )
      } else {
        logger.error(
          `❌ [onAiStream] SSE stream failed: ${toAiStreamLogTarget(chatId, messageId)}`,
          error,
        )

        if (!res.writableEnded) {
          res.write(
            `data: ${JSON.stringify({
              error: toErrorMessage(error, 'Internal Server Error'),
            })}\n\n`,
          )
        }
      }
    } finally {
      // 1. 결과 처리 및 상태 업데이트
      if (chatId && messageId && !isResponseSaved) {
        if (aiReplyText) {
          // 생성된 텍스트가 있다면 성공/일부 성공으로 저장
          try {
            await updateAiResponse({
              chatId,
              messageId,
              text: aiReplyText,
            })
            isResponseSaved = true
            logger.info(
              `✅ [onAiStream] Response finalized and saved: ${toAiStreamLogTarget(chatId, messageId)}`,
            )
          } catch (saveError) {
            logger.error(
              `❌ [onAiStream] Final response save failed: ${toAiStreamLogTarget(chatId, messageId)}`,
              saveError,
            )
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
              `⚠️ [onAiStream] No text generated, status set to failed: ${toAiStreamLogTarget(chatId, messageId)}`,
            )
          } catch (failError) {
            logger.error(
              `❌ [onAiStream] Failed to set error status: ${toAiStreamLogTarget(chatId, messageId)}`,
              failError,
            )
          }
        }
      }

      // 2. 아직 열려 있는 HTTP 응답 종료
      if (!res.writableEnded) {
        res.end()
      }
    }
  },
)
