/**
 * Firestore에서 해당 사용자의 fcmToken을 제거
 * @param userId Firestore 내 사용자 문서 ID
 * @param token 제거할 FCM 토큰
 */
import {FieldValue, Firestore, getFirestore} from 'firebase-admin/firestore'
import {Messaging, MulticastMessage} from 'firebase-admin/messaging'
import isEmpty from 'lodash/isEmpty'
import * as logger from 'firebase-functions/logger'
import {LRUCache} from 'lru-cache'

// 전역(Global) 캐시 인스턴스 (인스턴스 생존 기간 동안 유지)
// 유저 FCM 토큰 캐시 (TTL: 10분)
const userTokensCache = new LRUCache<string, string[]>({
  max: 2000, // 최대 2000명의 유저 토큰 캐싱
  ttl: 1000 * 60 * 10,
})

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
  seq?: number
}

/**
 * 채팅방 멤버들에게 푸시 알림을 전송
 */
export const sendPushToChatMembers = async (
  db: Firestore,
  messaging: Messaging,
  chatId: string,
  message: PushMessageData,
) => {
  try {
    // 1) 채팅방 정보 조회
    // members는 푸시 수신 권한과 직결되므로 캐싱하지 않고 항상 최신 값을 사용합니다.
    const chatRef = db.doc(`chats/${chatId}`)
    const chatDoc = await chatRef.get()
    if (!chatDoc.exists) return

    const members = chatDoc.get('members') as string[]
    const chatType = chatDoc.get('type')
    const chatName = chatDoc.get('name')
    const chatImage = chatDoc.get('image')
    const lastSeq = message.seq ?? chatDoc.get('lastSeq')

    if (!Array.isArray(members) || members.length < 2) return

    const senderId = message.senderId
    const receiverIds = members.filter(uid => uid !== senderId)
    const isGroup = chatType === 'group'

    // 2) 수신자들의 fcmToken 추출 (캐시 활용)
    const targetUsers: {uid: string; fcmToken: string}[] = []
    const missingUids: string[] = []

    receiverIds.forEach(uid => {
      const cachedTokens = userTokensCache.get(uid)
      if (cachedTokens) {
        // 캐시에 있으면 바로 추가
        cachedTokens.forEach(token => targetUsers.push({uid, fcmToken: token}))
      } else {
        // 캐시에 없으면 DB 조회 대기열에 추가
        missingUids.push(uid)
      }
    })

    const hitCount = receiverIds.length - missingUids.length
    if (hitCount > 0) {
      logger.info(`[Cache HIT] 유저 ${hitCount}명의 토큰 캐시에서 불러옴`)
    }

    // 캐시에 없는 유저들만 DB에서 한꺼번에 조회
    if (missingUids.length > 0) {
      const userSnaps = await Promise.all(
        missingUids.map(uid => db.doc(`users/${uid}`).get()),
      )

      let newCachedCount = 0

      for (const userSnap of userSnaps) {
        if (!userSnap.exists) continue
        const userData = userSnap.data()
        const fcmTokens = Array.isArray(userData?.fcmTokens)
          ? (userData.fcmTokens as string[])
          : []

        // 조회한 데이터를 캐시에 10분간 저장합니다.
        // 토큰이 없는 유저도 빈 배열로 캐싱해 반복 DB 조회를 줄입니다.
        userTokensCache.set(userSnap.id, fcmTokens)
        newCachedCount++

        if (fcmTokens.length > 0) {
          for (const token of fcmTokens) {
            targetUsers.push({uid: userSnap.id, fcmToken: token})
          }
        }
      }
      
      if (newCachedCount > 0) {
        logger.info(
          `[Cache MISS] 유저 ${newCachedCount}명의 토큰 DB 조회 및 캐싱 완료`,
        )
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
        roomName: String(chatName ?? ''),
        roomImage: String(chatImage ?? ''),
        lastSeq: String(lastSeq ?? ''),
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
            // 캐시 무효화: 다음 번 푸시 때 DB에서 무조건 새로 읽어오도록 캐시 삭제
            userTokensCache.delete(uid)
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
    const db = getFirestore()
    const userRef = db.doc(`users/${userId}`)

    await userRef.update({
      fcmTokens: FieldValue.arrayRemove(token),
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
