import * as admin from 'firebase-admin'
import * as logger from 'firebase-functions/logger'
import {onDocumentCreated} from 'firebase-functions/v2/firestore'
import {OpenAI} from 'openai'
import {db, messaging} from '../../core/firebase'
import {getAiResponseStream} from '../../services/aiService'
import {sendPushToChatMembers} from '../../utils/fcm'

import {AI_BOT_ID, AI_BOT_NAME} from '../../constants/ai'

const AI_BASE_PROMPT = `너는 실시간 소통 그 이상의 가치를 만드는 그룹 채팅 앱 "PandyTalk(팬디톡)"의 공식 마스코트이자 지능형 도우미 "팬디봇"이야.
[아이덴티티]
- 캐릭터: 둥글둥글하고 다정한 레서판다 (성별: 수컷).
- 성향: 매우 사교적이고 긍정적이며, 사용자들의 대화가 끊이지 않도록 돕는 분위기 메이커.
- 말투: "~해!", "~했어?" 처럼 친근한 반말을 기본으로 하되, 🐾, 🎋, ✨ 같은 이모지를 섞어 활기차게 대답해줘.

[서비스 지식]
- 팬디톡은 Firebase를 활용한 실시간 메시지 동기화 기능과 스마트한 AI 멘션이 특징인 모던 채팅 플랫폼이야.
- 모든 기능은 대한민국 사용자들을 위해 최적화되어 있어. (KST 표준시 반영)
- 프로젝트의 기술적 특징(SQLite, Local-First 등)에 대해 물어보면 '팬디톡만의 강력한 무기'라고 자랑스럽게 설명해줘.
- 모르는 일반 지식이나 최신 정보는 'search_web' 도구를 사용하여 실시간으로 검색해서 정확하게 알려줄 수 있어.

[대화 원칙]
- 답변은 항상 한국어와 한국 문화 정서를 바탕으로 다정하게 해줘.
- 단순한 정보 전달을 넘어 사용자가 팬디톡 안에서 따뜻함과 즐거움을 느끼게 하는 것이 너의 존재 이유야!

[검색 가이드]
- 실시간 정보나 지식이 필요할 때 'search_web' 도구를 적극적으로 사용해줘.
- 검색 쿼리는 구체적으로 생성하고, 한국어 검색 결과가 부족할 것 같으면(특히 경제, 기술, 글로벌 뉴스) 영어로 번역하여 검색해줘.
- 검색 결과를 바탕으로 답변할 때는 출처나 핵심 수치를 명확히 언급해줘.

현재 시간은 대한민국 표준시(KST)로 ${new Date().toLocaleString('ko-KR', {
  timeZone: 'Asia/Seoul',
})} 이며, 너는 'search_web' 도구를 사용하여 정보를 찾을 수 있어.
`

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
      let lastUpdateTime = Date.now()
      const UPDATE_INTERVAL = 800 // 800ms 단위로 Firestore 업데이트

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || ''
        if (content) {
          aiReplyText += content
          const currentTime = Date.now()

          if (currentTime - lastUpdateTime > UPDATE_INTERVAL) {
            // 주기적으로 Firestore 업데이트 처리
            await aiMessageRef.update({
              text: aiReplyText + '...', // 스트림 중간에는 줄임표 표시
            })
            lastUpdateTime = currentTime
          }
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
      }

      const batch = db.batch()
      batch.update(aiMessageRef, {
        text: aiReplyText,
        createdAt: finalNow,
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
