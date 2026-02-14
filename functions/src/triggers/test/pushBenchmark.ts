import * as logger from 'firebase-functions/logger'
import {onCall} from 'firebase-functions/v2/https'
import {performance} from 'perf_hooks'
import {db} from '../../core/firebase'

/**
 * 직렬(Sequential) 처리 vs 병렬(Parallel) 처리의 성능 차이를 측정합니다.
 */

/*
curl -X POST https://asia-northeast3-csh-rn.cloudfunctions.net/testDbPerformanceCompare \
-H "Content-Type: application/json" \
-d '{"data": {"memberCount": 100}}'
*/
export const testDbPerformanceCompare = onCall(
  {
    region: 'asia-northeast3',
  },
  async request => {
    // 테스트할 멤버 수 (예: 5, 10, 30명 등 단톡방 규모 가정)
    const testMemberCount = request.data.memberCount || 10
    // 실제 DB에 있는 유저 ID들을 가져오거나 가상의 ID를 준비합니다.
    const chatId = request.data.chatId || 'sample_chat_id'

    // 1. 수신자 ID 리스트 준비 (테스트 전용 컬렉션 test_chats 사용)
    const chatDoc = await db.doc(`test_chats/${chatId}`).get()
    let receiverIds = ((chatDoc.get('members') as string[]) || []).slice(
      0,
      testMemberCount,
    )

    // 만약 테스트 채팅방에 멤버가 적으면 임의의 ID들로 보충
    if (receiverIds.length < testMemberCount) {
      for (let i = 0; i < testMemberCount; i++) {
        receiverIds.push(`test_user_${i}`)
      }
    }

    // --- CASE A: 직렬 조회 (반복문 내 await) ---
    const seqStart = performance.now()
    const seqData = []
    for (const uid of receiverIds) {
      // 테스트 전용 컬렉션 test_users 사용
      const snap = await db.doc(`test_users/${uid}`).get()
      seqData.push(snap.exists)
    }
    const seqTime = performance.now() - seqStart

    // [직렬 방식 로그] GCP 대시보드 반영용
    logger.info(`🚀 Push Performance Metrics`, {
      chatId: `${chatId}_seq`,
      receiverCount: receiverIds.length,
      total_ms: seqTime,
      db_query_ms: seqTime,
      fcm_send_ms: 0,
      cleanup_ms: 0,
      avg_ms_per_token: seqTime / receiverIds.length,
      method: 'sequential',
    })

    // --- CASE B: 병렬 조회 (Promise.all) ---
    const parStart = performance.now()
    const promises = receiverIds.map(uid => db.doc(`test_users/${uid}`).get())
    const parSnaps = await Promise.all(promises)
    const parTime = performance.now() - parStart

    // [병렬 방식 로그] GCP 대시보드 반영용
    logger.info(`🚀 Push Performance Metrics`, {
      chatId: `${chatId}_par`,
      receiverCount: receiverIds.length,
      total_ms: parTime,
      db_query_ms: parTime,
      fcm_send_ms: 0,
      cleanup_ms: 0,
      avg_ms_per_token: parTime / receiverIds.length,
      method: 'parallel',
    })

    const improvement = (((seqTime - parTime) / seqTime) * 100).toFixed(2)

    return {
      success: true,
      summary: `병렬 처리가 직렬 처리보다 ${improvement}% 더 빠릅니다.`,
      results: {
        sequential_ms: seqTime,
        parallel_ms: parTime,
        improvement_rate: `${improvement}%`,
      },
    }
  },
)
