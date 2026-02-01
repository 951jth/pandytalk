### SQLite 도입에 따른 채팅 성능 개선 리포트

#### 1. 성능 요약 (Summary)

| 구분                  | 평균 속도     | 안정성 (지터)          | UX 등급                   |
| :-------------------- | :------------ | :--------------------- | :------------------------ |
| **Firestore (Cloud)** | **~286.74ms** | 낮음 (최대 535ms)      | 보통 (네트워크 대기 발생) |
| **SQLite (Local)**    | **~9.24ms**   | **매우 높음 (±1.5ms)** | **최상 (즉각적인 응답)**  |

> **개선 결과:** 로컬 DB 도입 후 데이터 로딩 속도가 **약 31배 향상**되었으며, 네트워크 환경에 관계없이 일관된 사용자 경험(Deterministic UX)을 제공함.

#### 2. 상세 측정 데이터 (Latency)

**[측정 지표 설명]**

- `FIRESTORE_FETCH`: 클라우드(Firestore)에서 네트워크를 통해 메시지 데이터를 가져오는 시간.
- `SQLITE_SAVE`: 서버에서 가져온 데이터를 로컬 SQLite DB에 기록(저장)하는 시간.
- `FETCH_CHAT_MESSAGES`: 로컬 SQLite DB에서 메시지 데이터를 읽어오는 시간 (실질적인 UI 노출 속도).

- **CASE 1.**
  [Performance][FIRESTORE_FETCH] 303.76ms
  [Performance][SQLITE_SAVE] 15.06ms
  [Performance][FETCH_CHAT_MESSAGES] 8.45ms
- **CASE 2.**
  [Performance][FIRESTORE_FETCH] 183.91ms
  [Performance][SQLITE_SAVE] 10.45ms
  [Performance][FETCH_CHAT_MESSAGES] 8.44ms
- **CASE 3.**
  [Performance][FIRESTORE_FETCH] 535.88ms
  [Performance][SQLITE_SAVE] 12.94ms
  [Performance][FETCH_CHAT_MESSAGES] 10.91ms
- **CASE 4.**
  [Performance][FIRESTORE_FETCH] 254.26ms
  [Performance][SQLITE_SAVE] 9.21ms
  [Performance][FETCH_CHAT_MESSAGES] 10.49ms
- **CASE 5.**
  [Performance][FIRESTORE_FETCH] 155.90ms
  [Performance][SQLITE_SAVE] 9.29ms
  [Performance][FETCH_CHAT_MESSAGES] 7.89ms

> _참고: 위 수치는 `usePerformanceMeasure`를 통해 측정된 실시간 데이터입니다._

#### 2. UX 체감 지표 (UX Indicators)

- **시각적 즉각성:** 채팅방 진입 시 스피너(Loading Indicator) 노출 시간이 거의 제거되어, 사용자가 앱이 훨씬 "가볍다"고 느끼게 됨.
- **연속성:** 스크롤을 올려 이전 메시지를 불러올 때(Paging), 네트워크 대기 시간 없이 즉시 목록에 추가되어 끊김 없는 스크롤 경험 제공.
- **안정성:** 지하철, 엘리베이터 등 네트워크가 불안정한 환경에서도 기존 대화 내역을 조회할 수 있어 서비스 신뢰도 상승.

#### 3. 개발자 관점 개선 사항

- **비용 최적화:** 동일한 메시지를 반복해서 불러올 때 서버 리드(Read) 비용이 발생하지 않아 Firestore 사용량 대폭 절감.
- **데이터 가공 효율:** SQLite의 정렬 및 필터링 기능을 활용하여 클라이언트 측에서의 JS 가공 시간을 일정하게 유지.
- **Firestore 성능** 최저 155ms ~ 최고 535ms로 약 380ms의 차이가 납니다. 사용자 입장에서는 앱이 "어떨 때는 빠르고 어떨 때는 답답하다"는 느낌이 들었는데, sqlite에서는 시간차이가 균일함.

---
