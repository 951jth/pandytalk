import * as admin from 'firebase-admin'
import * as logger from 'firebase-functions/logger'
import {AI_BOT_ID, AI_BOT_NAME} from '../constants/ai'
import {db, messaging} from '../core/firebase'
import {sendPushToChatMembers} from '../utils/fcm'

/**
 * AI의 초기 "입력 중" 메시지 객체를 생성합니다.
 */
export function createAiInitialMessage(params: {
  id: string
  prompt: string
  mentionerId: string
  seq: number
}) {
  const {id, prompt, mentionerId, seq} = params
  return {
    id,
    text: '팬디봇이 답변을 생성 중입니다...',
    prompt,
    mentionerId,
    type: 'ai_text' as const,
    senderId: AI_BOT_ID,
    senderName: AI_BOT_NAME,
    seq,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    status: 'streaming' as const,
    skipPush: true,
  }
}

/**
 * AI 응답 완료 후 Firestore를 업데이트하고 푸시 알림을 전송합니다.
 */
export async function updateAiResponse(params: {
  chatId: string
  messageId: string
  text: string
  createdAt?: number | admin.firestore.Timestamp | admin.firestore.FieldValue
}) {
  const {chatId, messageId, text} = params

  try {
    const roomRef = db.doc(`chats/${chatId}`)
    const messageRef = roomRef.collection('messages').doc(messageId)
    const now = admin.firestore.FieldValue.serverTimestamp()
    let createdAt = params.createdAt

    if (!createdAt) {
      const messageSnap = await messageRef.get()
      const messageData = messageSnap.data()
      createdAt = messageData?.createdAt || now
    }

    const finalMessage = {
      id: messageId,
      text,
      senderId: AI_BOT_ID,
      senderName: AI_BOT_NAME,
      createdAt,
      type: 'ai_text' as const,
      status: 'success' as const,
    }

    const batch = db.batch()

    // 1. 메시지 문서 업데이트
    batch.update(messageRef, {
      text,
      // createdAt: now,
      status: 'success' as const,
    })

    // 2. 채팅방 상단 요약 및 실시간 맥락 캐싱 업데이트
    const chatSnap = await roomRef.get()
    const prevRecent = (chatSnap.get('recentMessages') as any[]) || []
    const updatedRecent = [
      ...prevRecent,
      {role: 'assistant' as const, content: text},
    ].slice(-10)

    batch.update(roomRef, {
      lastMessage: finalMessage,
      lastMessageAt: createdAt,
      recentMessages: updatedRecent, // AI 답변도 맥락에 추가!
    })

    await batch.commit()

    // 3. 푸시 알림 전송 (비동기 처리 가능하도록 await 포함)
    await sendPushToChatMembers(db, messaging, chatId, {
      id: messageId,
      chatId,
      text,
      type: 'ai_text',
      senderId: AI_BOT_ID,
      senderName: AI_BOT_NAME,
      createdAt: Date.now(), // 클라이언트용 숫자 타임스탬프
    })

    logger.info(
      `[aiChatService] Successfully updated AI response: ${messageId}`,
    )
  } catch (err) {
    logger.error(
      `[aiChatService] Failed to update AI response: ${messageId}`,
      err,
    )
    throw err
  }
}

/**
 * AI 응답 생성 중 에러 발생 시 상태를 'failed'로 변경합니다.
 */
export async function handleAiError(params: {
  chatId: string
  messageId: string
  error?: any
}) {
  const {chatId, messageId, error} = params
  logger.error(`[aiChatService] AI Error Handled for ${messageId}:`, error)

  try {
    const messageRef = db.doc(`chats/${chatId}/messages/${messageId}`)
    await messageRef.update({
      status: 'failed',
      text: '답변을 생성하는 중에 오류가 발생했습니다. 잠시 후 재시도 해주세요.',
      error: error?.message || 'Unknown error',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
  } catch (err) {
    logger.error('[aiChatService] Critical failure in handleAiError:', err)
  }
}
