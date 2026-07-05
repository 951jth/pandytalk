import type {MulticastMessage} from 'firebase-admin/messaging'
import {logger} from 'firebase-functions/v1'
import {onDocumentUpdated} from 'firebase-functions/v2/firestore'
import {messaging} from '../../core/firebase'

export const onUserApprove = onDocumentUpdated(
  {
    region: 'asia-northeast3',
    document: 'users/{userId}',
  },
  async event => {
    try {
      // 1. 데이터 변경 전/후 가져오기 (DB 조회 불필요! ⚡️)
      const beforeData = event.data?.before.data()
      const afterData = event.data?.after.data()

      // 데이터가 없으면 중단 (삭제된 경우 등)
      if (!afterData || !beforeData) return

      const oldStatus = beforeData.accountStatus
      const newStatus = afterData.accountStatus

      // 2. 🔥 핵심 로직: 상태가 바뀌지 않았거나, 'confirm'으로 바뀐 게 아니면 무시
      // (예: 대기 -> 거절, 거절 -> 대기, 프로필 수정 등은 여기서 걸러짐)
      if (oldStatus === newStatus || newStatus !== 'confirm') {
        return
      }

      logger.info(
        `✅ 계정 승인 감지: ${event.params.userId} (${oldStatus} -> ${newStatus})`,
      )

      // 3. 알림 발송 로직 (afterData를 바로 사용)
      const fcmTokens = afterData.fcmTokens as string[] | undefined
      if (!fcmTokens || fcmTokens.length === 0) {
        logger.info('❌ 전송할 FCM 토큰이 없습니다.')
        return
      }

      const multicastMessage: MulticastMessage = {
        tokens: fcmTokens,
        notification: {
          title: '계정 승인 완료',
          body: '축하합니다! 귀하의 계정이 승인되었습니다.',
        },
        android: {
          priority: 'high',
        },
        apns: {
          headers: {'apns-priority': '10'},
          payload: {
            aps: {
              alert: {
                title: '계정 승인 완료',
                body: '축하합니다! 귀하의 계정이 승인되었습니다.',
              },
              sound: 'default',
            },
          },
        },
        data: {
          pushType: 'join_approve',
        },
      }

      const response = await messaging.sendEachForMulticast(multicastMessage)
      logger.info(
        `✅ 푸시 전송 완료: 성공 ${response.successCount} / 실패 ${response.failureCount}`,
      )
    } catch (e) {
      logger.error('onUserApprove 트리거 처리 중 오류 발생', e)
    }
  },
)
