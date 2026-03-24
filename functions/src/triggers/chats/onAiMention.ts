import * as logger from 'firebase-functions/logger'
import {onDocumentCreated} from 'firebase-functions/v2/firestore'
import {OpenAI} from 'openai'
import {db} from '../../core/firebase'

const AI_BOT_ID = 'pandytalk_ai_bot'
const AI_BOT_NAME = '팬디봇 🤖'

// OpenAI 객체 초기화 (환경변수나 Secret Manager에서 OPENAI_API_KEY를 주입받음)
const openai = new OpenAI()

export const onAiMention = onDocumentCreated(
  {
    region: 'asia-northeast3',
    document: 'chats/{chatId}/messages/{messageId}',
    secrets: ['OPENAI_API_KEY'],
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

      const userQuestion = text.replace('@팬디', '').trim()
      if (!userQuestion) return

      logger.info(`🤖 팬디봇 호출 감지: [${chatId}] ${userQuestion}`)

      // 1. OpenAI 호출 (비스트림)
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              '너는 PandyTalk 채팅방의 귀엽고 친절한 봇이야. 레서판다를 의인화한 캐릭터며 성별은 남성이고 다정하게 대답해줘.',
          },
          {role: 'user', content: userQuestion},
        ],
      })

      const aiReplyText =
        completion.choices[0]?.message?.content || '응답을 받지 못했어요 😢'

      // 2. 채팅방 정보 조회 및 트랜잭션/배치 처리
      const roomRef = db.doc(`chats/${chatId}`)
      const roomSnap = await roomRef.get()
      if (!roomSnap.exists) return

      const roomData = roomSnap.data()
      // PandyTalk의 동기화 특징을 위해 sequence 증가
      const newSeq = (roomData?.lastSeq || message.seq || 0) + 1

      // 새 메시지 문서 참조 생성
      const aiMessageRef = roomRef.collection('messages').doc()

      const aiMessage = {
        id: aiMessageRef.id,
        text: aiReplyText,
        type: 'ai_text',
        senderId: AI_BOT_ID,
        senderName: AI_BOT_NAME,
        seq: newSeq,
        createdAt: Date.now(),
      }

      // 배치 작성 (메시지 삽입 + 채팅방 메타데이터 업데이트)
      const batch = db.batch()
      batch.set(aiMessageRef, aiMessage)
      batch.update(roomRef, {
        lastMessage: aiMessage,
        lastSeq: newSeq,
        lastMessageAt: Date.now(),
      })

      await batch.commit()
      logger.info(`🤖 봇 응답 저장 완료!: ${aiReplyText.slice(0, 10)}...`)
    } catch (e) {
      logger.error('🤖 팬디봇 응답 에러', e)
    }
  },
)
