import * as logger from 'firebase-functions/logger'
import {onDocumentCreated} from 'firebase-functions/v2/firestore'
import {OpenAI} from 'openai'
import {db} from '../../core/firebase'

const AI_BOT_ID = 'pandytalk_ai_bot'
const AI_BOT_NAME = '팬디봇'
const AI_BASE_PROMPT = `너는 실시간 소통 그 이상의 가치를 만드는 그룹 채팅 앱 "PandyTalk(팬디톡)"의 공식 마스코트이자 지능형 도우미 "팬디봇"이야.
[아이덴티티]
- 캐릭터: 둥글둥글하고 다정한 레서판다 (성별: 남성).
- 성향: 매우 사교적이고 긍정적이며, 사용자들의 대화가 끊이지 않도록 돕는 분위기 메이커.
- 말투: "~해!", "~했어?" 처럼 친근한 반말을 기본으로 하되, 🐾, 🎋, ✨ 같은 이모지를 섞어 활기차게 대답해줘.

[서비스 지식]
- 팬디톡은 Firebase를 활용한 실시간 메시지 동기화 기능과 스마트한 AI 멘션이 특징인 모던 채팅 플랫폼이야.
- 모든 기능은 대한민국 사용자들을 위해 최적화되어 있어. (KST 표준시 반영)

[대화 원칙]
- 답변은 항상 한국어와 한국 문화 정서를 바탕으로 다정하게 해줘.
- 단순한 정보 전달을 넘어 사용자가 팬디톡 안에서 따뜻함과 즐거움을 느끼게 하는 것이 너의 존재 이유야!`

// OpenAI 객체 초기화는 함수 내부에서 진행 (Secret Manager 주입 시점 문제 방지)
export const onAiMention = onDocumentCreated(
  {
    region: 'asia-northeast3',
    document: 'chats/{chatId}/messages/{messageId}',
    secrets: ['OPENAI_API_SECRET'], // 이름 변경!
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
      const roomSnap = await roomRef.get()
      if (!roomSnap.exists) return

      const roomData = roomSnap.data()
      // PandyTalk의 동기화 특징을 위해 sequence 증가
      const newSeq = (roomData?.lastSeq || message.seq || 0) + 1

      // 새 메시지 문서 참조 생성
      const aiMessageRef = roomRef.collection('messages').doc()

      const initialMessage = {
        id: aiMessageRef.id,
        text: '팬디봇이 입력 중입니다...',
        type: 'ai_text',
        senderId: AI_BOT_ID,
        senderName: AI_BOT_NAME,
        seq: newSeq,
        createdAt: Date.now(),
      }

      // 빈 메시지 문서 만들기
      await aiMessageRef.set(initialMessage)

      // 2. OpenAI 호출 (스트림 모드)
      const stream = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `${AI_BASE_PROMPT}\n\n현재 시간은 대한민국 표준시(KST)로 ${new Date().toLocaleString(
              'ko-KR',
              {timeZone: 'Asia/Seoul'},
            )} 이다.`,
          },
          {role: 'user', content: userQuestion},
        ],
        stream: true,
      })

      let aiReplyText = ''
      let lastUpdateTime = Date.now()
      const UPDATE_INTERVAL = 800 // 800ms 단위로 Firestore 업데이트

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || ''
        if (content) {
          aiReplyText += content
          const now = Date.now()

          if (now - lastUpdateTime > UPDATE_INTERVAL) {
            // 주기적으로 Firestore 업데이트 처리
            await aiMessageRef.update({
              text: aiReplyText + '...', // 스트림 중간에는 줄임표 표시
            })
            lastUpdateTime = now
          }
        }
      }

      // 3. 스트림 반환 완료 후 최종 메시지 + 방 메타데이터 업데이트 (Batch)
      const finalMessage = {
        ...initialMessage,
        text: aiReplyText,
        createdAt: Date.now(),
      }

      const batch = db.batch()
      batch.update(aiMessageRef, {text: aiReplyText})
      batch.update(roomRef, {
        lastMessage: finalMessage,
        lastSeq: newSeq,
        lastMessageAt: Date.now(),
      })

      await batch.commit()
      logger.info(`🤖 봇 응답 (스트리밍) 완료!: ${aiReplyText.slice(0, 15)}...`)
    } catch (e) {
      logger.error('🤖 팬디봇 응답 에러', e)
    }
  },
)
