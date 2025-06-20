// functions/src/index.ts
import {initializeApp} from 'firebase-admin/app'
import {getFirestore} from 'firebase-admin/firestore'
import {getMessaging, MulticastMessage} from 'firebase-admin/messaging' // ✅ 올바른 경로
import {logger} from 'firebase-functions'
import {onDocumentCreated} from 'firebase-functions/v2/firestore'

initializeApp()
const db = getFirestore()
const messaging = getMessaging()

//파이어베이스에서 chats의 messages 가 추가될 때 마다 호출되는 함수
export const sendNewMessageNotification = onDocumentCreated(
  {
    region: 'asia-northeast3', // 도쿄 리전
    document: 'chats/{chatId}/messages/{messageId}',
  },
  async (event: any) => {
    try {
      const message = event.data?.data()
      logger.info('message', message)
      const chatId = event.params.chatId
      if (!message || !chatId) {
        logger.warn('⚠️ message or chatId 누락')
        return
      }

      const senderId: string = message.senderId
      if (!senderId) return
      const text: string = message.text || ''

      // 1. 채팅방 문서에서 members 배열 가져오기
      const chatDoc = await db.doc(`chats/${chatId}`).get()
      const members = chatDoc.get('members') as string[]
      if (!Array.isArray(members) || members.length < 2) {
        logger.warn(`⚠️ members 필드 오류, chatId=${chatId}`)
        return
      }

      if (!Array.isArray(members) || members.length < 2) {
        logger.warn('⚠️ 유효하지 않은 members 배열')
        return
      }

      const receiverIds = members.filter(uid => uid !== senderId)

      // 2. 수신자들의 fcmToken 조회
      const tokens: string[] = []

      for (const uid of receiverIds) {
        const userSnap = await db.doc(`users/${uid}`).get()
        const token = userSnap.get('fcmToken')
        if (token) tokens.push(token)
      }

      if (tokens.length === 0) {
        logger.info('❌ 전송할 토큰 없음')
        return
      }

      // 3. 멀티캐스트 메시지 생성
      const multicastMessage: MulticastMessage = {
        tokens,
        notification: {
          title: message?.senderName ?? '새 메시지 도착!',
          body: text ?? '내용이 없습니다',
        },
        android: {
          notification: {
            tag: `chat_${chatId}`, // 같은 채팅방은 덮어쓰기
            // clickAction: 'CHAT_ACTIVITY', // 앱에서 정의한 액션
          },
          priority: 'high',
        },
        apns: {
          headers: {
            'apns-priority': '10',
          },
          payload: {
            aps: {
              alert: {
                title: message?.senderName || '새 메시지',
                body: text,
              },
              sound: 'default',
              'thread-id': `chat_${chatId}`, // iOS 같은 채팅 스레드로 묶기
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
        },
      }
      // 4. 메시지 전송
      const response = await messaging.sendEachForMulticast(multicastMessage)
      logger.info(
        `✅ 푸시 전송 완료: 성공 ${response.successCount} / 실패 ${response.failureCount}`,
      )
      logger.info(tokens)
      response.responses.forEach((res, i) => {
        if (!res.success) {
          console.error(`❌ FCM 실패: [${tokens[i]}] → ${res.error?.message}`)
        } else {
          console.log(`✅ 성공: ${tokens[i]}`)
        }
      })
    } catch (e) {
      console.error('푸시 오류', e)
    }
  },
)
