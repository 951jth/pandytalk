import {MulticastMessage} from 'firebase-admin/messaging'
import * as logger from 'firebase-functions/logger'
import {onDocumentCreated} from 'firebase-functions/v2/firestore'
import {performance} from 'perf_hooks'
import {db, messaging} from '../../core/firebase'
import {removeEmptyValues, removeFcmTokenFromUser} from '../../utils/fcm'

export const sendNewMessageNotification = onDocumentCreated(
  {
    region: 'asia-northeast3',
    document: 'chats/{chatId}/messages/{messageId}',
  },
  async event => {
    const startTime = performance.now()
    const metrics: Record<string, number> = {}

    try {
      const message = event.data?.data()
      const chatId = event.params.chatId as string
      if (!message || !chatId) {
        logger.info('⚠️ message or chatId 누락')
        return
      }

      const senderId: string = message.senderId
      if (!senderId) return
      const text: string = message.text || ''

      // 1) 채팅방 및 수신 유저 정보 조회 (DB 성능 측정)
      const dbStart = performance.now()
      const chatDoc = await db.doc(`chats/${chatId}`).get()
      let members = chatDoc.get('members') as string[]
      const chatType = chatDoc.get('type')

      if (!Array.isArray(members) || members.length < 2) {
        logger.warn(`⚠️ members 필드 오류, chatId=${chatId}`)
        return
      }
      const receiverIds = members.filter(uid => uid !== senderId)
      const isGroup = chatType == 'group'

      const promises = receiverIds.map(uid => db.doc(`users/${uid}`).get())
      const userSnaps = await Promise.all(promises)
      metrics['db_query_ms'] = performance.now() - dbStart

      // 2) 수신자들의 fcmToken 추출
      const targetUsers: {uid: string; fcmToken: string}[] = []
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
          chatType: String(chatType ?? ''),
        },
      }

      // 3) FCM 실제 전송 시간 측정
      const fcmStart = performance.now()
      const response = await messaging.sendEachForMulticast(multicastMessage)
      metrics['fcm_send_ms'] = performance.now() - fcmStart

      // 4) 전송 실패 건 처리 및 토큰 정리 시간 측정
      const cleanupStart = performance.now()
      await Promise.all(
        response.responses.map(async (res, i) => {
          const {uid, fcmToken} = targetUsers[i]
          if (!res.success) {
            const code = res.error?.code || res.error?.message
            const deletable = [
              'messaging/invalid-registration-token',
              'messaging/registration-token-not-registered',
              'Requested entity was not found',
            ]
            if (code && deletable.includes(code)) {
              await removeFcmTokenFromUser(uid, fcmToken)
            }
          }
        }),
      )
      metrics['cleanup_ms'] = performance.now() - cleanupStart

      // jsonPayload: {
      // avg_ms_per_token: 944.2351249999992 // 토큰당 평균 응답 시간
      // chatId: "mKn39zVd5MgDIse1KuPg"
      // cleanup_ms: 0.08348599999590078 // 토큰 정리 시간
      // db_query_ms: 681.4999640000024 // DB 조회 시간
      // fcm_send_ms: 261.5937969999941 // FCM 전송 시간
      // message: "🚀 Push Performance Metrics"
      // receiverCount: 1
      // total_ms: 944.2351249999992 // 총 응답 시간
      // }

      // 5) 최종 성능 로그 (이 로그를 Cloud Logging에서 메트릭으로 사용)
      const totalTime = performance.now() - startTime
      logger.info(`🚀 Push Performance Metrics`, {
        chatId,
        receiverCount: targetUsers.length,
        total_ms: totalTime,
        ...metrics,
        avg_ms_per_token: totalTime / targetUsers.length,
      })
    } catch (e) {
      logger.error('푸시 오류', e as Error)
    }
  },
)
