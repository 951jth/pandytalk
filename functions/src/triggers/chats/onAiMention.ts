import {getFunctions} from 'firebase-admin/functions'
import * as logger from 'firebase-functions/logger'
import {onDocumentCreated} from 'firebase-functions/v2/firestore'
import {db} from '../../core/firebase'

import {AI_BOT_ID} from '../../constants/ai'
import {createAiInitialMessage} from '../../services/aiChatService'

// OpenAI 객체 초기화는 함수 내부에서 진행 (Secret Manager 주입 시점 문제 방지)
export const onAiMention = onDocumentCreated(
  {
    region: 'asia-northeast3',
    document: 'chats/{chatId}/messages/{messageId}',
    secrets: ['OPENAI_API_SECRET', 'TAVILY_API_SECRET', 'SERPER_API_SECRET'],
  },
  async event => {
    try {
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

      // 초기 메시지 객체 생성 (공통 서비스 활용)
      const initialMessage = createAiInitialMessage({
        id: aiMessageRef.id,
        prompt,
        mentionerId: senderId,
        seq: 0, // 트랜잭션 내에서 업데이트됨
      })

      await db.runTransaction(async tx => {
        const roomSnap = await tx.get(roomRef)
        const roomData = roomSnap.data()
        if (!roomSnap.exists) throw new Error('채팅방이 존재하지 않습니다.')

        newSeq = (roomData?.lastSeq || message.seq || 0) + 1
        initialMessage.seq = newSeq

        tx.set(aiMessageRef, initialMessage)
        tx.update(roomRef, {
          lastSeq: newSeq,
          lastMessageAt: initialMessage.createdAt,
          lastMessage: initialMessage,
        })
      })

      logger.info(
        `🤖 팬디봇 메시지 예약 완료: [${chatId}] messageId=${aiMessageRef.id}`,
      )

      // 2. [추가] 질문자가 15초 내에 SSE를 시작하지 않을 경우를 대비한 가상 보험(Cloud Task) 예약
      try {
        // v2 함수의 리전이 default(us-central1)가 아니므로 전체 경로를 명시해야 합니다.
        const queue = getFunctions().taskQueue(
          'locations/asia-northeast3/functions/onAiStreamBackup',
        )
        await queue.enqueue(
          {
            chatId,
            messageId: aiMessageRef.id,
            prompt,
          },
          {
            scheduleDelaySeconds: 15, // 15초 대기 후 체크
          },
        )
        logger.info(`🤖 백업 태스크 예약 완료: ${aiMessageRef.id}`)
      } catch (err) {
        logger.error('🤖 백업 태스크 예약 실패', err)
      }
    } catch (e) {
      logger.error('🤖 팬디봇 트리거 에러', e)
    }
  },
)
