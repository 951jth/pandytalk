// 푸시 발송 대상 등록만 필요할 때: registerDevice
import {fcmRemote} from '@app/features/notification/data/fcmRemote.firebase'
import {notificationRemote} from '@app/features/notification/data/notificationRemote.firebase'

export const notificationService = {
  async registerDevice(uid?: string): Promise<void> {
    try {
      // 1. 권한 확인
      const hasPermission = await notificationRemote.requestPermission()
      if (!hasPermission) {
        console.warn('⚠️ 알림 권한이 거부되었습니다.')
        return
      }
      if (!uid) return
      // 2. iOS APNs 등록 (Data Layer에서 OS 체크를 하므로 여기선 그냥 호출)
      await notificationRemote.registerAPNs()

      // 3. 토큰 발급
      const token = await fcmRemote.getFcmToken()

      // 4. DB 저장
      if (token) {
        await fcmRemote.saveTokenToUser(uid, token)
      }
    } catch (error) {
      console.error('🚨 디바이스 등록 실패:', error)
      throw error // 필요 시 UI에서 처리하도록 throw
    }
  },
}
