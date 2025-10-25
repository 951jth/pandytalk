import {MulticastMessage} from 'firebase-admin/messaging'
import * as logger from 'firebase-functions/logger'
import {onDocumentCreated} from 'firebase-functions/v2/firestore'
import {db, messaging} from '../../core/firebase'
import {removeFcmTokenFromUser} from '../../utils/fcm'

export const sendNewMessageNotification = onDocumentCreated(
  {
    region: 'asia-northeast3',
    document: 'chats/{chatId}/messages/{messageId}',
  },
  async event => {
    try {
      const message = event.data?.data()
      const chatId = event.params.chatId as string
      if (!message || !chatId) {
        logger.warn('⚠️ message or chatId 누락')
        return
      }

      const senderId: string = message.senderId
      if (!senderId) return
      const text: string = message.text || ''

      // 1) 채팅방에서 members 배열 조회 (필요시 groupMembers로 대체)
      const chatDoc = await db.doc(`chats/${chatId}`).get()
      let members = chatDoc.get('members') as string[]
      const chatType = chatDoc.get('type')
      if (!Array.isArray(members) || members.length < 2) {
        logger.warn(`⚠️ members 필드 오류, chatId=${chatId}`)
        return
      }
      const receiverIds = members.filter(uid => uid !== senderId)

      // 2) 수신자들의 fcmToken 조회  (※ 기존 코드의 덮어쓰기 버그 수정: push/concat)
      const targetUsers: {uid: string; fcmToken: string}[] = []
      for (const uid of receiverIds) {
        const userSnap = await db.doc(`users/${uid}`).get()
        const userData = userSnap.data()
        if (!userData) continue
        const fcmTokens = userData.fcmTokens as string[] | undefined
        if (Array.isArray(fcmTokens)) {
          for (const token of fcmTokens)
            targetUsers.push({uid, fcmToken: token})
        }
      }
      if (targetUsers.length === 0) {
        logger.info('❌ 전송할 토큰 없음')
        return
      }

      // 3) 멀티캐스트 메시지
      const multicastMessage: MulticastMessage = {
        tokens: targetUsers.map(u => u.fcmToken),
        notification: {
          title: message?.senderName ?? '새 메시지 도착!',
          body: text ?? '내용이 없습니다',
        },
        android: {
          notification: {tag: `chat_${chatId}`},
          priority: 'high',
        },
        apns: {
          headers: {'apns-priority': '10'},
          payload: {
            aps: {
              alert: {title: message?.senderName || '새 메시지', body: text},
              sound: 'default',
              'thread-id': `chat_${chatId}`,
            },
          },
        },
        data: {
          chatId: String(chatId),
          text: message.text ?? '',
          type: message.type ?? '',
          senderId: String(message.senderId ?? ''),
          senderName: message.senderName ?? '',
          senderPicURL: message.senderPicURL ?? '',
          imageUrl: message.imageUrl ?? '',
          createdAt: String(message.createdAt ?? Date.now()),
          pushType: 'chat',
          chatType,
        },
      }

      // 4) 전송 및 실패 토큰 정리
      const response = await messaging.sendEachForMulticast(multicastMessage)
      logger.info(
        `✅ 푸시 전송 완료: 성공 ${response.successCount} / 실패 ${response.failureCount}`,
      )

      await Promise.all(
        response.responses.map(async (res, i) => {
          const {uid, fcmToken} = targetUsers[i]
          if (!res.success) {
            const code = res.error?.code || res.error?.message
            logger.error('❌ FCM 전송 실패', {uid, fcmToken, error: code})
            const deletable = [
              'messaging/invalid-registration-token',
              'messaging/registration-token-not-registered',
              'Requested entity was not found',
            ]
            if (code && deletable.includes(code)) {
              await removeFcmTokenFromUser(uid, fcmToken)
            }
          } else {
            logger.info(`✅ 성공: ${fcmToken}`)
          }
        }),
      )
    } catch (e) {
      logger.error('푸시 오류', e as Error)
    }
  },
)
