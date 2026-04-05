import * as admin from 'firebase-admin'
import {onSchedule} from 'firebase-functions/v2/scheduler'
import {db} from '../../core/firebase'

/**
 * 30분마다 실행되며, 1시간 이상 활동이 없는(lastSeen 기준) 온라인 유저를 오프라인으로 전환합니다.
 * (비용 최적화를 위해 주기를 늘리고, 실시간 오프라인 판단은 클라이언트 UI 로직에 맡깁니다.)
 */
export const cleanupInactiveUsers = onSchedule(
  {
    schedule: 'every 60 minutes',
    region: 'asia-northeast3',
    timeZone: 'Asia/Seoul',
  },
  async event => {
    const currentTime = admin.firestore.Timestamp.now()
    // 1시간 전 타임스탬프 계산 (60분 * 60초 * 1000밀리초)
    const thresholdMillis = currentTime.toMillis() - 60 * 60 * 1000
    const thresholdDate = admin.firestore.Timestamp.fromMillis(thresholdMillis)

    console.log(
      `🧹 비활성 유저 정리 배치 시작... 기준 시간: ${thresholdDate.toDate().toISOString()}`,
    )

    try {
      // 1시간 이상 lastSeen 업데이트가 없는 온라인 유저 검색
      const snapshot = await db
        .collection('users')
        .where('status', '==', 'online')
        .where('lastSeen', '<', thresholdDate)
        .get()

      if (snapshot.empty) {
        console.log('✅ 정리할 비활성 유저가 없습니다.')
        return
      }

      const batch = db.batch()
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          status: 'offline',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      })

      await batch.commit()
      console.log(`✅ ${snapshot.size}명의 유저를 오프라인으로 최종 전환 완료.`)
    } catch (error) {
      console.error('❌ 비활성 유저 정리 배치 오류:', error)
    }
  },
)
