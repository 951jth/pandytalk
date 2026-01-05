# 🚀 채팅 앱 데이터 정합성 및 성능 최적화 리팩토링 로그

> **Project:** PandyTalk (Side Project)  
> **Topic:** 실시간 채팅의 데이터 정합성(Consistency)과 사용자 경험(UX) 간의 트레이드오프 해결  
> **Tech Stack:** React Native, SQLite, React Query, Socket/Firebase

## 1. 배경 및 문제 상황 (Background & Problem)

채팅 앱 개발 중 **"메시지 수신 시 데이터 처리 흐름"**을 설계하는 과정에서 딜레마가 발생함.

- **기존 고민:** 데이터의 신뢰성(Single Source of Truth)을 위해, 소켓으로 받은 메시지를 **① SQLite에 먼저 저장하고 → ② 다시 `SELECT` 해서 UI에 뿌려야 할까?**
- **성능 이슈:** 매 메시지 수신마다 `Write` + `Read` I/O가 발생하여 UI 반응 속도가 느려질 우려가 있음.
- **핵심 질문:** 데이터 정합성을 해치지 않으면서 UI 반응성을 극대화할 수 있는 아키텍처는 무엇인가?

## 2. 해결 과정 (Problem Solving Process)

### 이슈 1: 실시간 메시지 처리 전략 (Re-fetch vs Direct Use)

**A. 접근 방식 비교**

1.  **Option A (엄격한 정합성):** Socket 수신 → SQLite 저장(await) → SQLite 조회 → UI 업데이트
    - _단점:_ I/O 오버헤드로 인한 미세한 렌더링 지연.
2.  **Option B (성능 중심):** Socket 수신 → **React Query 캐시 즉시 업데이트(UI 반영)** → 백그라운드 SQLite 저장

**B. 의사결정**

- **결론:** **Option B (Hybrid 접근)** 채택.
- **근거:** 채팅의 실시간성은 UX의 핵심. 서버에서 내려온 데이터(`payload`) 자체가 신뢰할 수 있는 원본이므로, 굳이 로컬 DB를 거쳐 꺼낼 필요가 없음.
- **보완책:** UI는 즉시 갱신하되, SQLite 저장은 `fire-and-forget` 혹은 비동기로 처리하여 데이터 영속성(Persistence)만 확보함.

---

### 이슈 2: 앱 진입/재접속 시 데이터 싱크 (Synchronization Gap)

**A. 문제점**
앱이 꺼져있거나 네트워크가 끊긴 동안 발생한 **메시지 공백(Gap)**과 **실시간 소켓 구독(Subscribe)** 사이의 타이밍 이슈.

**B. 해결 로직 설계**
데이터 누락을 방지하기 위해 다음의 순차적 흐름을 정립함.

1.  **Load Local:** 진입 시 SQLite의 최신 메시지를 먼저 로드 (Zero Latency).
2.  **Fetch Gap:** 로컬의 마지막 `lastSeq` 이후 데이터를 서버 REST API로 요청.
3.  **Sync & Update:** 가져온 데이터를 SQLite에 저장하고 로컬 상태 갱신.
4.  **Subscribe:** **(핵심)** 싱크가 완료된 시점의 **갱신된 `lastSeq`**를 기준으로 소켓 구독 시작.

> **Key Insight:** 싱크 완료 후 구독을 시작함으로써, Gap 채우기와 실시간 수신 사이의 데이터 충돌(Race Condition)을 원천 차단함.

---

### 이슈 3: 낙관적 업데이트와 중복 처리 (Optimistic Update & Deduplication)

**A. 문제점 (Ghost Message)**

- 내가 보낸 메시지를 UI에 먼저 표시(Optimistic Update, 임시 ID) → 서버 전송 → 소켓으로 내 메시지가 다시 수신(서버 ID).
- 이때 ID가 달라 **같은 메시지가 두 개로 보이는 문제** 발생.

**B. 초기 접근 (UUID 매칭)**

- 메시지에 고유 `uuid`를 태워서 보내고, 수신 시 `uuid`를 대조하여 교체(Replace)하는 방식 고려.
- _단점:_ 로직이 복잡하고 연산 비용 발생.

**C. 최종 해결책 (Pre-generated Client ID)**

- **ID 생성 주체 변경:** 서버가 아닌 **클라이언트가 메시지 생성 시 ID를 미리 발급**하는 방식 도입.
- **작동 원리:**
  - 전송 시: `id: 'msg_123'` (Local)
  - 수신 시: `id: 'msg_123'` (Server Echo)
- **결과:** ID가 동일하므로 별도의 교체 로직 없이, `Map` 자료구조에 덮어씌우는 것만으로 **자동 중복 제거(Idempotency)** 및 데이터 최신화(Seq 업데이트) 달성.

## 3. 핵심 코드 (Refactored Code)

**메시지 병합 및 정렬 유틸리티 (Deduplication Logic)**
