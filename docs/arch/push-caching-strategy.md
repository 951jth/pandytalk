# Firebase Cloud Functions: 푸시 알림 캐싱(Caching) 전략

## 배경
채팅방(`chats/${chatId}`)에 메시지가 발생할 때마다 발송되는 푸시 알림(`sendPushToChatMembers`)은 다음과 같은 병목을 발생시킵니다.
1. **Firestore Read 비용 증가:** 1개의 메시지당 `채팅방 조회 1회 + 수신자 토큰 조회 N회`의 읽기(Read) 비용이 발생.
2. **지연 시간(Latency):** 단기간에 메시지가 폭발적으로 쏟아지는(Burst) 상황에서 매번 DB를 조회하면 푸시 발송이 지연됨.

이를 해결하기 위해 캐싱을 도입할 수 있으며, 두 가지 주요 아키텍처 옵션이 있습니다.

---

## 아키텍처 옵션 비교

### ✅ Option 1: Node.js 메모리 캐싱 (LRU-Cache) - [추천/현재 채택]
- **비용:** **무료 (0원)**
- **방식:** Cloud Function 인스턴스의 로컬 메모리(RAM)에 데이터를 캐싱
- **장점:** 
  - 설정이 매우 간단하고 빠름.
  - 인스턴스가 살아있는 동안(Warm 상태) 반복적인 DB Read를 거의 0으로 줄여줌.
- **단점 (Trade-offs):**
  - **인스턴스 간 캐시 공유 불가:** 트래픽이 늘어 인스턴스가 여러 개 뜰 경우, 각 인스턴스마다 별도의 캐시를 가집니다.
  - **콜드 스타트 시 증발:** 트래픽이 없어 서버가 꺼졌다 켜지면 캐시가 초기화됩니다.

### 🚀 Option 2: Redis (Google Cloud Memorystore) - [향후 스케일업 용도]
- **비용:** 월 최소 약 $35+ (약 4~5만 원의 고정 비용 발생)
- **방식:** 별도의 분산형 인메모리 스토리지 서버 구축
- **장점:** 
  - **글로벌 캐시 공유:** 인스턴스가 100개가 떠도 모두 동일한 캐시를 바라보므로 Hit Rate가 극대화됩니다.
  - **강력한 일괄 조회(mget):** 100명의 유저 토큰을 `mget` 명령어로 0.001초 만에 한 번에 가져올 수 있습니다.
- **단점 (Trade-offs):**
  - **비용:** 접속자가 없어도 고정 인프라 유지비가 듭니다.
  - **인프라 세팅 복잡:** 펑션이 VPC 사설망에 있는 Redis에 접속하기 위해 Serverless VPC Access 커넥터 설정이 필수입니다.
  - **네트워크 레이턴시:** 내장 램에서 꺼내는 LRU Cache(0.0001초)보다 네트워크를 타야 하는 Redis(1~2ms)가 미세하게 느릴 수 있습니다.

---

## Redis 도입 시 코드 구조 (참고용 설계)

나중에 트래픽이 수만 명 단위로 커져서 Redis를 도입하게 될 경우, 다음과 같이 코드가 구성됩니다.

### 1. 전역 Redis 클라이언트 세팅
```typescript
import Redis from 'ioredis';

// 클라우드 펑션 인스턴스가 켜질 때 1번만 연결됨
const redis = new Redis({
  host: process.env.REDIS_HOST, // VPC 내부 IP
  port: Number(process.env.REDIS_PORT) || 6379,
});

const CHAT_TTL = 300; // 채팅방 캐시 5분
const TOKEN_TTL = 600; // 유저 토큰 캐시 10분
```

### 2. 푸시 발송 로직 (`sendPushToChatMembers` 내부)

#### Step A: 채팅방 정보 조회 (Read-Through)
```typescript
// 1) Redis에서 채팅방 정보 먼저 꺼내보기
let chatInfo;
const cachedChat = await redis.get(`chat:${chatId}`);

if (cachedChat) {
  chatInfo = JSON.parse(cachedChat); // Cache Hit!
} else {
  // Cache Miss: DB에서 읽고 Redis에 5분간 저장
  const chatDoc = await db.doc(`chats/${chatId}`).get();
  chatInfo = { members: chatDoc.get('members'), type: chatDoc.get('type') };
  await redis.setex(`chat:${chatId}`, CHAT_TTL, JSON.stringify(chatInfo));
}
```

#### Step B: 수신자 토큰 멀티 조회 (`mget` 최적화)
```typescript
const receiverIds = chatInfo.members.filter(uid => uid !== message.senderId);
const tokenKeys = receiverIds.map(uid => `userTokens:${uid}`);

// 2) 수신자 전원의 토큰을 '단 한 번'에 모두 조회!
const cachedTokensList = await redis.mget(...tokenKeys);

const targetUsers: {uid: string; fcmToken: string}[] = [];
const missingUids: string[] = [];

// 3) 캐시 상태 분류
receiverIds.forEach((uid, index) => {
  const cached = cachedTokensList[index];
  if (cached) {
    JSON.parse(cached).forEach(t => targetUsers.push({ uid, fcmToken: t }));
  } else {
    missingUids.push(uid); // 캐시에 없는 유저 모으기
  }
});

// 4) 캐시에 없는 유저들만 DB에서 파이프라인(mset)으로 저장
if (missingUids.length > 0) {
  const snaps = await Promise.all(missingUids.map(uid => db.doc(`users/${uid}`).get()));
  const pipeline = redis.pipeline();
  
  snaps.forEach(snap => {
    const tokens = snap.data()?.fcmTokens || [];
    tokens.forEach(t => targetUsers.push({ uid: snap.id, fcmToken: t }));
    pipeline.setex(`userTokens:${snap.id}`, TOKEN_TTL, JSON.stringify(tokens));
  });
  
  await pipeline.exec(); // 한방에 쿼리 전송
}
```

#### Step C: 캐시 무효화 (Invalidation)
```typescript
// 알림 전송 후 실패한 토큰 정리
const response = await messaging.sendEachForMulticast(multicastMessage);

await Promise.all(
  response.responses.map(async (res, i) => {
    if (!res.success) {
      const { uid, fcmToken } = targetUsers[i];
      await removeFcmTokenFromUser(uid, fcmToken); // DB 지우기
      await redis.del(`userTokens:${uid}`); // Redis 캐시도 즉시 폭파
    }
  })
);
```

---

## 결론
- **현재 상황:** 사용자 규모와 비용 효율을 고려할 때 Option 1 (LRU-Cache) 방식이 가장 적합합니다.
- **향후 계획:** DAU(일일 활성 사용자)가 만 명을 돌파하여 하루 Firestore 읽기 요금이 Redis 유지비($35)를 초과하게 될 때, 위 설계에 따라 Option 2로 마이그레이션합니다.
