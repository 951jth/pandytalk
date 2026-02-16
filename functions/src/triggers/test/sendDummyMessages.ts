import * as logger from 'firebase-functions/logger'
import {onCall} from 'firebase-functions/v2/https'
import {db} from '../../core/firebase'

/**
 * 테스트용 더미 메시지 생성 함수
 * @param roomId 채팅방 ID
 * @param count 생성할 메시지 개수 (기본 10개)
 * @param senderId 발신자 ID (기본 'system_test')
 */
export const sendDummyMessages = onCall(
  {
    region: 'asia-northeast3',
  },
  async request => {
    const {
      roomId,
      count = 10,
      senderId = 'system_test',
      senderName = '테스트봇',
    } = request.data

    if (!roomId) {
      return {success: false, error: 'roomId가 필요합니다.'}
    }

    try {
      const chatRef = db.doc(`chats/${roomId}`)

      const result = await db.runTransaction(async transaction => {
        const chatSnap = await transaction.get(chatRef)
        const currentSeq = chatSnap.get('lastSeq') || 0
        const messagesRef = db.collection(`chats/${roomId}/messages`)

        let lastSeq = currentSeq
        const now = new Date()

        for (let i = 1; i <= count; i++) {
          const nextSeq = currentSeq + i
          const msgRef = messagesRef.doc()

          transaction.set(msgRef, {
            seq: nextSeq,
            senderId,
            senderName,
            text: `[더미 메시지 ${nextSeq}] 테스트 중입니다.`,
            type: 'text',
            createdAt: now,
            imageUrl: '',
            senderPicURL: null,
          })
          lastSeq = nextSeq
        }

        transaction.update(chatRef, {
          lastSeq: lastSeq,
          lastMessageAt: now,
          lastMessage: {
            seq: lastSeq,
            text: `[더미 메시지 ${lastSeq}] 테스트 중입니다.`,
            senderId,
            createdAt: now,
            type: 'text',
            imageUrl: '',
          },
        })

        return {lastSeq}
      })

      return {
        success: true,
        message: `${count}개의 더미 메시지가 생성되었습니다. (마지막 Seq: ${result.lastSeq})`,
      }
    } catch (e) {
      logger.error('더미 메시지 생성 중 오류', e as Error)
      return {success: false, error: (e as Error).message}
    }
  },
)
