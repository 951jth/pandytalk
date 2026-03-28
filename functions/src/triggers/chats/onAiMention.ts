import * as admin from 'firebase-admin'
import * as logger from 'firebase-functions/logger'
import {onDocumentCreated} from 'firebase-functions/v2/firestore'
import {OpenAI} from 'openai'
import {db, messaging} from '../../core/firebase'
import {getAiResponseStream} from '../../services/aiService'
import {sendPushToChatMembers} from '../../utils/fcm'

import {AI_BASE_PROMPT, AI_BOT_ID, AI_BOT_NAME} from '../../constants/ai'

// OpenAI 객체 초기화는 함수 내부에서 진행 (Secret Manager 주입 시점 문제 방지)
export const onAiMention = onDocumentCreated(
  {
    region: 'asia-northeast3',
    document: 'chats/{chatId}/messages/{messageId}',
    secrets: ['OPENAI_API_SECRET', 'TAVILY_API_SECRET', 'SERPER_API_SECRET'],
  },
  async event => {
    try {
      // 바꾼 시크릿 변수명 지정하여 객체 생성
      const openai = new OpenAI({apiKey: process.env.OPENAI_API_SECRET})
      const message = event.data?.data()
      const chatId = event.params.chatId as string

      if (!message || !chatId) return

      const senderId: string = message.senderId
      const text: string = message.text || ''

      // 무한 루프 방지: 봇이 보낸 메시지면 무시
      if (senderId === AI_BOT_ID) return

      // "@팬디" 멘션 확인
      if (!text.includes('@팬디')) return

      const prompt = text.replace('@팬디', '').trim()
      if (!prompt) return

      logger.info(`🤖 팬디봇 호출 감지: [${chatId}] ${prompt}`)

      // 1. 채팅방 정보 조회 및 초기 메시지 생성 (타이핑 인디케이터용)
      const roomRef = db.doc(`chats/${chatId}`)
      const aiMessageRef = roomRef.collection('messages').doc()

      let newSeq = 0
      const now = admin.firestore.FieldValue.serverTimestamp()

      const initialMessage = {
        id: aiMessageRef.id,
        text: '팬디봇이 입력 중입니다...',
        prompt: prompt, // SSE에서 사용할 실제 질문 보관
        mentionerId: senderId, // 중복 방지를 위해 질문자 UID 보관
        type: 'ai_text',
        senderId: AI_BOT_ID,
        senderName: AI_BOT_NAME,
        seq: 0, // 트랜잭션 내에서 설정됨
        createdAt: now,
        status: 'streaming',
        skipPush: true, // 입력 중 상태는 푸시 생략
      }

      await db.runTransaction(async tx => {
        const roomSnap = await tx.get(roomRef)
        const roomData = roomSnap.data()
        if (!roomSnap.exists) throw new Error('채팅방이 존재하지 않습니다.')

        newSeq = (roomData?.lastSeq || message.seq || 0) + 1
        initialMessage.seq = newSeq

        tx.set(aiMessageRef, initialMessage)
        tx.update(roomRef, {
          lastSeq: newSeq,
          lastMessageAt: now,
          lastMessage: initialMessage,
        })
      })

      logger.info(
        `🤖 팬디봇 메시지 예약 완료: [${chatId}] messageId=${aiMessageRef.id}`,
      )
    } catch (e) {
      logger.error('🤖 팬디봇 트리거 에러', e)
    }
  },
)
