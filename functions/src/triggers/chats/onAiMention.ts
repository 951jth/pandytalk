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

      const userQuestion = text.replace('@팬디', '').trim()
      if (!userQuestion) return

      logger.info(`🤖 팬디봇 호출 감지: [${chatId}] ${userQuestion}`)

      // 1. 채팅방 정보 조회 및 초기 메시지 생성 (타이핑 인디케이터용)
      const roomRef = db.doc(`chats/${chatId}`)
      const aiMessageRef = roomRef.collection('messages').doc()

      let newSeq = 0
      const now = admin.firestore.FieldValue.serverTimestamp()

      await db.runTransaction(async tx => {
        const roomSnap = await tx.get(roomRef)
        const roomData = roomSnap.data()
        if (!roomSnap.exists) throw new Error('채팅방이 존재하지 않습니다.')

        // PandyTalk의 동기화 특징을 위해 sequence 증가
        newSeq = (roomData?.lastSeq || message.seq || 0) + 1

        const initialMessage = {
          id: aiMessageRef.id,
          text: '팬디봇이 입력 중입니다...',
          type: 'ai_text',
          senderId: AI_BOT_ID,
          senderName: AI_BOT_NAME,
          seq: newSeq,
          createdAt: now,
          status: 'streaming',
          skipPush: true, // 초기 메시지는 푸시 알림 생략
        }

        // 초기 메시지 생성
        tx.set(aiMessageRef, initialMessage)

        // 채팅방 순번 즉시 업데이트 (Race Condition 방지)
        tx.update(roomRef, {
          lastSeq: newSeq,
          lastMessageAt: now,
          lastMessage: initialMessage,
        })
      })

      logger.info(`🤖 팬디봇 순번 예약 완료: [${chatId}] seq=${newSeq}`)

      // 2. OpenAI 호출 준비 (Tool 사용)
      const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
        {
          type: 'function',
          function: {
            name: 'search_web',
            description:
              '모르는 정보나 실시간 정보를 위해 인터넷 검색을 수행해',
            parameters: {
              type: 'object',
              properties: {
                query: {type: 'string', description: '검색할 키워드'},
              },
              required: ['query'],
            },
          },
        },
      ]

      const systemPrompt = {
        role: 'system' as const,
        content: `${AI_BASE_PROMPT}
`,
      }

      const userMessage = {role: 'user' as const, content: userQuestion}

      let messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        systemPrompt,
        userMessage,
      ]

      // 2. AI 응답 스트림 획득 (aiService 활용)
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
        }
      }

      // 3. 스트림 반환 완료 후 최종 메시지 + 방 메타데이터 업데이트 (Batch)
      const finalNow = admin.firestore.FieldValue.serverTimestamp()
      const finalMessage = {
        id: aiMessageRef.id,
        seq: newSeq,
        text: aiReplyText,
        senderId: AI_BOT_ID,
        createdAt: finalNow,
        type: 'ai_text' as const,
        imageUrl: '',
        senderName: AI_BOT_NAME,
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

      // 4. 최종 답변 푸시 알림 수동 전송
      await sendPushToChatMembers(db, messaging, chatId, {
        id: aiMessageRef.id,
        chatId,
        text: aiReplyText,
        type: 'ai_text',
        senderId: AI_BOT_ID,
        senderName: AI_BOT_NAME,
        createdAt: Date.now(), // 푸시에는 resolved timestamp 전달 (FieldValue 사용 불가)
      })

      logger.info(
        `🤖 봇 응답 완료 및 푸시 전송!: ${aiReplyText.slice(0, 15)}...`,
      )
    } catch (e) {
      logger.error('🤖 팬디봇 응답 에러', e)
    }
  },
)
