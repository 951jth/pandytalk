# PandyTalk 오류 수정 회고록 (RN + Firebase + SQLite)

> 목적: 이번에 겪었던 오류/설계 이슈를 **재현 가능하게 정리**

## 0. 전제(내 아키텍처 기준)

- Feature Based Architecture(FBA)
- Screen/Hook → Service → Remote(Local) 단방향
- Firebase SDK 호출은 Remote 내부에서만
- SQLite는 Local(DataSource)로 분리
- React Query는 서버 상태 캐싱 + 실시간 구독 캐시 패치

---

## 1) `await`는 “레이어”가 아니라 “흐름” 기준으로 건다

### 문제 의식

- remote 내부에서 `await getDocs()`를 써도, service/hook에서 `await`이 필요하냐?

### 결론

- **필요하면 service/hook에서도 await 해야 함**
- remote의 `await`는 “remote 내부 순서” 보장일 뿐이고,
- 상위 레이어에서 결과를 가지고 분기/가공/후처리/에러처리하려면 **그 레이어가 await**해야 한다.

### 실무 규칙

- 결과를 즉시 써야 하면 `await`
- fire-and-forget(화면 나갈 때 lastRead 업데이트 같은 것)이면 `await` 생략 가능
- React Query queryFn/mutationFn 내부는 Promise 리턴(=await) 기준으로 작성

---

## 2) lastRead 업데이트 로직 점검: `seenSeq` 체크/명명/트랜잭션

### 이슈

- `seenSeq`가 number 필수인데 `if (!(roomId && userId && seenSeq)) return` 같은 형태는
  - `seenSeq === 0`일 때도 리턴되어버릴 수 있음(잠재 버그)

### 정리

- 현재 로직상 seq 0이 없더라도, 방어코드는 정확히 쓰는 게 맞음.

### 추천

- 검증은 명시적으로:
  - `if (!roomId || !userId || seenSeq == null) return`
- 함수명은 의도를 드러내기:
  - `updateChatLastReadByUser(roomId, userId, lastReadSeq)` 같은 형태가 설명성 좋음

---

## 3) Firestore 메시지 페이징: createdAt vs seq

### 발견한 문제(데이터 단절 가능성)

- createdAt(ms) 커서 기반 + “최신 N개만” 동기화 + SQLite를 truth로 사용할 때,
  - 앱이 꺼져있는 사이 메시지가 많이 쌓이면 **중간 구간이 SQLite에 없는 상태**가 발생
  - 이후 스크롤은 SQLite에서만 페이징되므로 **중간 70~80건이 영구 누락**될 수 있음

### 결론

- 채팅 도메인은 **seq 기반 커서**가 정합성/설명성에서 유리
- createdAt은 “정렬/표시”로 남기고, cursor는 seq로 통일하는 편이 안정적

### 추가 이슈(구독 limit)

- onSnapshot을 `limit(50)`로 걸어두면,
  - 앱이 꺼져있던 사이 120건이 들어온 경우, 50건만 감지되고 **70건은 구독으로도 못 메움**
- 따라서 subscription은 “실시간 보조”이고, **재진입 갭 동기화**는 별도 유스케이스로 반드시 존재해야 함

### 실무 해법(권장)

1. 앱/채팅방 진입 시:
   - SQLite의 `maxSeq`를 구함
   - 서버에서 `seq > maxSeq` 메시지를 **batch로 전부** 가져와 SQLite에 저장(갭 메움)
2. 그 다음에 onSnapshot으로 “실시간”만 처리

---

## 4) SQLite 레이어 분리: `sqliteCall`, 상수 기반 쿼리, transaction 패턴

### 목표

- Firebase remote처럼 SQLite local도 관측 가능(로그/성능/에러)하게 만들기
- 쿼리/컬럼 불일치로 생기는 “조용한 데이터 오염” 방지

### 결정

- `sqliteCall`은 `shared/sqlite/sqliteCall.ts`에 두고
- 내부에서 공통 logger를 호출(로거가 SQLite를 아는 구조는 피함)
- 테이블/컬럼은 상수로 관리하고, INSERT/UPSERT SQL을 그 상수에 귀속

#### 예시(컬럼/쿼리 상수)

```ts
const MESSAGE_TABLE = 'messages' as const
const MESSAGE_COLUMNS = [
  'id',
  'roomId',
  'text',
  'senderId',
  'createdAt',
  'type',
  'imageUrl',
  'seq',
] as const
const MESSAGE_COLUMN_SQL = MESSAGE_COLUMNS.join(', ')
const MESSAGE_PLACEHOLDERS = MESSAGE_COLUMNS.map(() => '?').join(', ')

const UPSERT_MESSAGE_SQL = `
INSERT OR REPLACE INTO ${MESSAGE_TABLE} (${MESSAGE_COLUMN_SQL})
VALUES (${MESSAGE_PLACEHOLDERS})
`
```

---

## 5) `db.transaction`과 `executeSql` 에러 처리: `return true`의 의미

### 오해 포인트

- `executeSql` 에러 콜백에서 `return true`를 왜 주는지?

### 정리

- 개념적으로는 `break;`와 비슷하지만 더 강함:
  - **이후 SQL 실행 중단 + 트랜잭션 실패/롤백 유도**
- `reject(error)`만 하고 `return true`를 안 주면,
  - 라이브러리/플랫폼/콜백 처리 방식에 따라 “에러가 소비되지 않거나”
  - 트랜잭션이 계속 진행되는 형태가 될 수 있어 정합성 리스크가 생김

### 실무 패턴

- resolve/reject는 **transaction의 onSuccess/onError**에서만 처리
- `executeSql` error 콜백은 “컨텍스트 로그 + return true” 용도

---

## 6) Promise의 resolve는 “값이 필수”가 아니다 (타입 추론 이슈)

### 문제

- `resolve()` 호출 시 “Expected 1 arguments” 같은 TS 오류가 발생

### 원인

- `new Promise((resolve) => ...)`에서 제네릭이 추론되어 `resolve(value: T)`로 굳음

### 해결

- 반환이 없으면 `Promise<void>`로 명시:

```ts
return new Promise<void>((resolve, reject) => {
  db.transaction(..., reject, () => resolve())
})
```

---

## 7) COUNT 쿼리: 문자열 치환 금지(바인딩 필수)

### 잘못된 예

```ts
;`SELECT COUNT(*) FROM messages WHERE roomId = ${roomId};`
```

### 이유

- SQL Injection 위험
- 문자열 따옴표/이스케이프 실수 위험
- 쿼리 재사용/성능 측면에서도 손해

### 정답

```ts
const query = `SELECT COUNT(*) as count FROM messages WHERE roomId = ?`
tx.executeSql(query, [roomId], ...)
```

---

## 8) 구독(onSnapshot)에서 async/await 처리 원칙

### 핵심

- onSnapshot 콜백에 `await`을 걸어도 다음 스냅샷을 막아주지 않음(백프레셔 없음)
- UI를 SQLite 저장 속도에 묶으면 체감 UX가 나빠질 수 있음

### 추천

- UI 반영(callback)은 먼저
- SQLite 저장은 fire-and-forget + 실패 로그
- “정합성 강제”가 필요하면 write queue(체인)로 겹침 방지

---

## 9) 최종 결론(내가 얻은 설계 기준)

1. cursor는 seq로 통일(정합성/설명성)
2. subscription은 “실시간 보조”, 재진입 갭은 “명시적 sync 유스케이스”로 메운다
3. SQLite도 Firebase처럼 boundary wrapper(sqliteCall)로 관측 가능하게
4. transaction은 성공/실패를 transaction 콜백에서만 resolve/reject
5. SQL은 무조건 바인딩(`?`) 사용
6. Promise 반환 타입은 명시(`Promise<void>`, `Promise<ChatMessage[]>`)

---

## TODO (다음 액션)

- [ ] messageService에 `syncMissingMessages(roomId)` 유스케이스 추가 (maxSeq 기반)
- [ ] messageLocal에 `getMaxSeq(roomId)` / `getMinSeq(roomId)` 추가
- [ ] SQLite index 추가: `(roomId, seq)` / `(roomId, createdAt)`
- [ ] subscription 시작 타이밍을 “sync 이후”로 고정
- [ ] onSnapshot limit(50)은 유지하되, 누락은 sync로 해소

---

## 참고: 내가 면접에서 이렇게 말할 포인트

- “실시간 구독은 보조 수단이고, 앱 재진입 시에는 로컬 커서 기반 갭 동기화를 별도 유스케이스로 수행해서 데이터 단절을 원천 차단했다.”
- “SQLite/Firebase 모두 IO boundary wrapper로 관측 가능하게 해서 장애/성능 분석이 가능하도록 했다.”
