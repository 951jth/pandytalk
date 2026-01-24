import { MulticastMessage } from 'firebase-admin/messaging'
import * as logger from 'firebase-functions/logger'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { db, messaging } from '../../core/firebase'
import { removeEmptyValues, removeFcmTokenFromUser } from '../../utils/fcm'

export const sendNewMessageNotification = onDocumentCreated(
  {
    region: 'asia-northeast3',
    document: 'chats/{chatId}/messages/{messageId}',
  },
  async event => {
    try {
      const message = event.data?.data()
      console.log('message', message)
      const chatId = event.params.chatId as string
      if (!message || !chatId) {
        logger.info('⚠️ message or chatId 누락')
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
      const isGroup = chatType == 'group'

      // 2) 수신자들의 fcmToken 조회  (※ 기존 코드의 덮어쓰기 버그 수정: push/concat)
      const targetUsers: {uid: string; fcmToken: string}[] = []

      const promises = receiverIds.map(uid => db.doc(`users/${uid}`).get())
      const userSnaps = await Promise.all(promises)

      for (const userSnap of userSnaps) {
        if (!userSnap.exists) continue

        const userData = userSnap.data()
        if (!userData) continue

        const uid = userData.uid || userSnap.id
        const fcmTokens = userData.fcmTokens as string[] | undefined

        if (Array.isArray(fcmTokens)) {
          for (const token of fcmTokens) {
            targetUsers.push({uid, fcmToken: token})
          }
        }
      }

      if (targetUsers.length === 0) {
        logger.info('❌ 전송할 토큰 없음')
        return
      }

      const rawMsg = message?.imageUrl
        ? '사진을 보냈습니다.'
        : (text ?? '내용 없음')
      let finalTitle = ''
      let finalBody = ''
      if (isGroup) {
        finalTitle = chatDoc.get('name') as string
        finalBody = `${message?.senderName}\n${rawMsg}`
      } else {
        finalTitle = message?.senderName
        finalBody = rawMsg
      }
      const multicastMessage: MulticastMessage = {
        tokens: targetUsers.map(u => u.fcmToken),
        notification: removeEmptyValues({
          title: finalTitle ?? '새 메시지 도착!',
          body: finalBody ?? '내용이 없습니다',
          imageUrl: message?.imageUrl ?? '',
          // title: message?.senderName ?? '새 메시지 도착!',
          // body: text ?? '내용이 없습니다',
        }),
        android: {
          notification: {tag: `chat_${chatId}`},
          priority: 'high',
        },
        apns: {
          headers: {'apns-priority': '10'},
          payload: {
            aps: {
              alert: {title: finalTitle || '새 메시지 도착!', body: finalBody},
              // title: message?.senderName ?? '새 메시지 도착!',
              // body: text ?? '내용이 없습니다',
              sound: 'default',
              'thread-id': `chat_${chatId}`,
            },
          },
        },
        data: {
          chatId: String(chatId),
          text,
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
