/**
 * Firestore에서 해당 사용자의 fcmToken을 제거
 * @param userId Firestore 내 사용자 문서 ID
 * @param token 제거할 FCM 토큰
 */
import admin from 'firebase-admin'
import {Messaging, MulticastMessage} from 'firebase-admin/messaging'
import {isEmpty} from 'lodash'
import * as logger from 'firebase-functions/logger'

interface PushMessageData {
  id: string
  chatId: string
  text: string
  type: string
  senderId: string
  senderName: string
  senderPicURL?: string
  imageUrl?: string
  createdAt: any
  chatType?: string
}

/**
 * 채팅방 멤버들에게 푸시 알림을 전송
 */
export const sendPushToChatMembers = async (
  db: admin.firestore.Firestore,
  messaging: Messaging,
  chatId: string,
  message: PushMessageData,
) => {
  try {
    // 1) 채팅방 정보 조회
    const chatRef = db.doc(`chats/${chatId}`)
    const chatDoc = await chatRef.get()
    if (!chatDoc.exists) return

    const members = chatDoc.get('members') as string[]
    const chatType = chatDoc.get('type')
    const chatName = chatDoc.get('name')

    if (!Array.isArray(members) || members.length < 2) return

    const senderId = message.senderId
    const receiverIds = members.filter(uid => uid !== senderId)
    const isGroup = chatType === 'group'

    // 2) 수신자들의 fcmToken 추출
    const userSnaps = await Promise.all(
      receiverIds.map(uid => db.doc(`users/${uid}`).get()),
    )
    const targetUsers: {uid: string; fcmToken: string}[] = []

    for (const userSnap of userSnaps) {
      if (!userSnap.exists) continue
      const userData = userSnap.data()
      const fcmTokens = userData?.fcmTokens as string[] | undefined
      if (Array.isArray(fcmTokens)) {
        for (const token of fcmTokens) {
          targetUsers.push({uid: userSnap.id, fcmToken: token})
        }
      }
    }

    if (targetUsers.length === 0) return

    // 3) 알림 내용 구성
    const text = message.text || ''
    const rawMsg = message.imageUrl ? '사진을 보냈습니다.' : text || '내용 없음'

    let finalTitle = ''
    let finalBody = ''

    if (isGroup) {
      finalTitle = chatName || '그룹 채팅'
      finalBody = `${message.senderName}\n${rawMsg}`
    } else {
      finalTitle = message.senderName || '새 메시지'
      finalBody = rawMsg
    }

    const multicastMessage: MulticastMessage = {
      tokens: targetUsers.map(u => u.fcmToken),
      notification: removeEmptyValues({
        title: finalTitle,
        body: finalBody,
        imageUrl: message.imageUrl ?? '',
      }),
      android: {
        notification: {tag: `chat_${chatId}`},
        priority: 'high',
      },
      apns: {
        headers: {'apns-priority': '10'},
        payload: {
          aps: {
            alert: {title: finalTitle, body: finalBody},
            sound: 'default',
            'thread-id': `chat_${chatId}`,
          },
        },
      },
      data: {
        id: String(message.id),
        chatId: String(chatId),
        text: text,
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

    // 4) FCM 전송
    const response = await messaging.sendEachForMulticast(multicastMessage)

    // 5) 실패 건 처리 (토큰 정리)
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

    logger.info(`✅ 푸시 전송 완료: ${chatId}, 수신자수: ${targetUsers.length}`)
  } catch (error) {
    logger.error(`❌ 푸시 전송 실패: ${chatId}`, error)
  }
}

/**
 * Firestore에서 해당 사용자의 FCM 토큰을 제거
 */
export const removeFcmTokenFromUser = async (userId: string, token: string) => {
  try {
    const db = admin.firestore()
    const userRef = db.doc(`users/${userId}`)

    await userRef.update({
      fcmTokens: admin.firestore.FieldValue.arrayRemove(token),
    })

    console.log(`✅ FCM 토큰 제거 완료: ${token}`)
  } catch (error) {
    console.error(`❌ FCM 토큰 제거 실패:`, error)
  }
}

// 메인 함수
export const removeEmptyValues = (obj: any): any => {
  // 1. 배열인 경우: 내부 요소 청소 후, 빈 요소 필터링
  if (Array.isArray(obj)) {
    return obj.map(v => removeEmptyValues(v)).filter(v => !isEmpty(v))
  }

  // 2. 객체인 경우: 내부 속성 재귀적으로 청소
  if (typeof obj === 'object' && obj !== null) {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      const cleanValue = removeEmptyValues(value)
      // 청소된 값이 '비어있지 않을 때만' 결과에 포함
      if (!isEmpty(cleanValue)) {
        acc[key] = cleanValue
      }
      return acc
    }, {} as any)
  }

  // 3. 기본 타입(숫자, 불리언 등)은 그냥 반환
  return obj
}
