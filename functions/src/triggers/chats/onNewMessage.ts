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
      logger.info('새 메시지 도착 트리거 실행', message)
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

      // 2) 수신자들의 fcmToken 조회  (※ 기존 코드의 덮어쓰기 버그 수정: push/concat)
      const userReads = receiverIds.map(uid => db.doc(`users/${uid}`).get())
      const userSnaps = await Promise.all(userReads) // 여기서 한방에 다 가져옴
      const targetUsers: {uid: string; fcmToken: string}[] = []

      for (const userSnap of userSnaps) {
        const userData = userSnap.data()
        if (!userData) continue

        const fcmTokens = userData.fcmTokens as string[] | undefined
        if (Array.isArray(fcmTokens)) {
          // 수신자의 ID와 토큰 매핑
          for (const token of fcmTokens) {
            targetUsers.push({uid: userSnap.id, fcmToken: token})
          }
        }
      }

      // 3) 멀티캐스트 메시지
      const multicastMessage: MulticastMessage = {
        tokens: targetUsers.map(u => u.fcmToken),
        notification: {
          title: message?.senderName ?? '새 메시지 도착!',
          body: text ?? '내용이 없습니다',
        },
        //안드로이드 전용 설정
        android: {
          //"알림 묶기(스택)" 또는 "덮어쓰기" 기능
          notification: {tag: `chat_${chatId}`},
          //안드로이드의 **Doze 모드(배터리 절약 모드)**를 뚫고 알림을 즉시 띄우겠다는 뜻
          priority: 'high',
        },
        //iOS 전용 설정 - Apple Push Notification Service
        apns: {
          // 즉시 전송하라는 명령 ( = priority: 'high')
          headers: {'apns-priority': '10'},
          payload: {
            aps: {
              alert: {title: message?.senderName || '새 메시지', body: text}, //iOS 알림 센터에 표시될 제목과 본문.
              sound: 'default', // 알림음
              'thread-id': `chat_${chatId}`, // 안드로이드의 tag랑 비슷
            },
          },
        },
        //커스텀 데이터 페이로드, String으로 넣어줘야함.
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
