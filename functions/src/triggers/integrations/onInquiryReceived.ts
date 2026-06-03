import {onRequest} from 'firebase-functions/v2/https'
import * as logger from 'firebase-functions/logger'
import {db, messaging} from '../../core/firebase'
import {FieldValue} from 'firebase-admin/firestore'
import {removeEmptyValues, removeFcmTokenFromUser} from '../../utils/fcm'
import type {MulticastMessage} from 'firebase-admin/messaging'

export const onInquiryReceived = onRequest(
  {
    region: 'asia-northeast3',
    cors: true, // 여러 출처(포트폴리오 등)에서 호출 가능하도록 허용
  },
  async (req, res) => {
    // POST 메서드만 허용
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed')
      return
    }

    try {
      const {source, type, email, message} = req.body

      // 필수 데이터 검증
      if (!email || !message) {
        res.status(400).json({error: 'Missing required fields: email or message'})
        return
      }

      // 1. 별도의 문의(inquiries) 컬렉션에 데이터 저장
      const inquiryRef = await db.collection('inquiries').add({
        source: source || 'unknown',
        type: type || 'general',
        email,
        message,
        status: 'pending', // 처리 상태 (대기 중)
        createdAt: FieldValue.serverTimestamp(),
      })

      logger.info(`✅ New inquiry saved: ${inquiryRef.id}`, {source, email})

      // 관리자(ADMIN) 유저들에게 푸시 발송
      const adminUsersSnap = await db
        .collection('users')
        .where('authority', '==', 'ADMIN')
        .get()

      const adminTokens: {uid: string; fcmToken: string}[] = []
      adminUsersSnap.forEach(doc => {
        const data = doc.data()
        const fcmTokens = Array.isArray(data.fcmTokens) ? data.fcmTokens : []
        fcmTokens.forEach((token: string) => {
          adminTokens.push({uid: doc.id, fcmToken: token})
        })
      })

      if (adminTokens.length > 0) {
        const finalTitle = `새로운 문의가 접수되었습니다`
        const finalBody = `[${type || 'general'}] ${email}: ${message}`

        const multicastMessage: MulticastMessage = {
          tokens: adminTokens.map(t => t.fcmToken),
          notification: removeEmptyValues({
            title: finalTitle,
            body: finalBody,
          }),
          android: {
            priority: 'high',
          },
          apns: {
            headers: {'apns-priority': '10'},
            payload: {
              aps: {
                alert: {title: finalTitle, body: finalBody},
                sound: 'default',
              },
            },
          },
          data: {
            pushType: 'admin_inquiry',
            inquiryId: inquiryRef.id,
          },
        }

        const response = await messaging.sendEachForMulticast(multicastMessage)

        // 실패한 토큰 정리
        await Promise.all(
          response.responses.map(async (res, i) => {
            const {uid, fcmToken} = adminTokens[i]
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

        logger.info(`✅ Admin push sent: ${response.successCount} successes`)
      }

      res.status(200).json({success: true, id: inquiryRef.id})
    } catch (error) {
      logger.error('❌ Error saving inquiry:', error)
      res.status(500).json({error: 'Internal Server Error'})
    }
  },
)
