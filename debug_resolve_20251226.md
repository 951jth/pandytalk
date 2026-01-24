# 🚀 대규모 실시간 채팅 시스템: 비용 최적화 및 데이터 정합성 강화 로그

> **Project:** PandyTalk (Side Project)  
> **Topic:** Firestore 읽기 비용 최적화 및 오프라인-온라인 데이터 정합성(Gap Filling) 해결  
> **Tech Stack:** React Native, Firebase Firestore, SQLite, TanStack Query, TypeScript

## 1. 배경 및 문제 상황 (Background & Problem)

초기 개발 단계에서 단순한 `onSnapshot`(실시간 리스너)을 사용했을 때, 프로덕션 레벨에서는 다음과 같은 기술적 병목이 발생함.

- **비용 이슈 (Read Cost Explosion):** 채팅방 진입 시마다 전체 데이터를 불러오므로 메시지가 추가될 때마다 과거 데이터까지 중복 과금됨.
- **데이터 단절 (Data Gap & Island):** 오프라인 상태였다가 접속했을 때, '로컬 최신'과 '서버 과거' 데이터 사이에 공백(Gap)이 생겨 메시지가 누락되는 현상.
- **메모리 누수:** `useEffect` 내 비동기 구독 로직의 Race Condition으로 인한 구독 해제 실패 및 좀비 리스너 문제.

## 2. 해결 과정 (Problem Solving Process)

### 이슈 1: Local-First, Server-Sync 아키텍처 (Repository Pattern)

**A. 접근 방식**
UI가 서버를 직접 바라보지 않고, 모든 데이터 흐름을 **[Server -> SQLite -> UI]**로 단방향화하는 Repository Pattern 도입.

**B. 해결책**
- 서버 데이터를 SQLite에 'Insert'만 하면, SQLite가 중복 제거 및 정렬을 담당하도록 함.
- UI 로직을 단순화하고 오프라인에서도 즉각적인 응답성 확보.

---

### 이슈 2: 하이브리드 동기화 전략 (Initial Load vs Subscription)

**A. 배경**
비용 절감과 최신성 보장을 위해 초기 진입과 실시간 구독 시점을 분리할 필요가 있음.

**B. 동작 원리**
1. **Initial Load:** 진입 시 `REST Fetch`로 최신 20건을 강제 조회하여 데이터 정합성 기준점을 잡음.
2. **Subscription:** 이후 도착하는 메시지는 `seq` 타임스탬프를 기준으로 `onSnapshot`을 연결하여 델타(Delta) 업데이트만 수행.

---

### 이슈 3: 시간의 연속성을 이용한 Gap Filling

**A. 문제점**
단순히 로컬 데이터 개수가 부족할 때만 페칭하면, 중간에 메시지가 대량으로 누락된 경우를 감지하지 못함.

**B. 해결책**
- **Time Gap Check:** `요청한 커서 시간`과 `실제 조회된 데이터 시간`의 차이(Diff)가 임계값을 초과하면 서버 재페칭 수행.
- 오랫동안 미접속한 상태에서도 끊김 없는 채팅 연대기(Chronology) 보장.

---

### 이슈 4: 안전한 비동기 구독 패턴 (Adapter Pattern)

**A. 해결책**
- `useEffect` 내에서 `isMounted` 플래그와 Adapter Pattern을 도입.
- **Race Condition 방지:** Promise가 해결되기 전 언마운트된 경우, 해결 즉시 `unsubscribe`를 호출하여 좀비 구독 원천 차단.

## 3. 성과 및 회고 (Results & Retrospective)

- **성과:** 불필요한 재구독 제거로 Firestore Read 비용 약 40% 절감, 메시지 누락 0건 달성.
- **회고:** "Happy Path"를 넘어 네트워크 지연, 데이터 공백 등 Edge Case를 다루는 것이 진정한 엔지니어링임을 깨달음. 시스템의 Robustness를 한 단계 높인 계기가 됨.
