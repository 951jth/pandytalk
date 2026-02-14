import * as logger from 'firebase-functions/logger'
import {onCall} from 'firebase-functions/v2/https'
import {db} from '../../core/firebase'

/**
 * 테스트를 위한 더미 데이터 세팅 함수
 * 1. test_users 컬렉션에 100명의 유저 생성
 * 2. test_chats 컬렉션에 위 100명이 포함된 채팅방 하나 생성
 */
export const setupTestDummyData = onCall(
  {
    region: 'asia-northeast3',
  },
  async request => {
    try {
      const batch = db.batch()
      const userIds: string[] = []

      // 1. 100명의 더미 유저 생성
      for (let i = 0; i < 100; i++) {
        const uid = `test_user_${i}`
        userIds.push(uid)
        const userRef = db.doc(`test_users/${uid}`)

        batch.set(userRef, {
          uid,
          displayName: `테스트유저_${i}`,
          email: `test_${i}@example.com`,
          authority: 'USER',
          status: 'offline',
          accountStatus: 'confirm',
          createdAt: new Date(),
          updatedAt: new Date(),
          fcmTokens: [`dummy_token_${i}`],
        })
      }

      // 2. 더미 채팅방 생성 (test_chats/sample_chat_id)
      const chatId = request.data.chatId || 'sample_chat_id'
      const chatRef = db.doc(`test_chats/${chatId}`)
      batch.set(chatRef, {
        id: chatId,
        type: 'group',
        name: '성능 테스트용 단톡방',
        members: userIds,
        createdAt: new Date(),
        lastMessageAt: new Date(),
        lastSeq: 0,
      })

      await batch.commit()

      return {
        success: true,
        message: `100명의 유저와 채팅방(${chatId})이 생성되었습니다.`,
      }
    } catch (e) {
      logger.error('더미 데이터 생성 중 오류', e as Error)
      return {success: false, error: (e as Error).message}
    }
  },
)
