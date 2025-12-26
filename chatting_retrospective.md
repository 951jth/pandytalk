# [Tech Retrospective] 대규모 실시간 채팅 시스템: 비용 최적화와 데이터 정합성을 향한 여정

## 1. 개요 (Overview)

- **프로젝트:** 팬디톡 (실시간 팬덤 소통 플랫폼) / Payking
- **역할:** 프론트엔드 리드 개발자 (5년 차)
- **기술 스택:** React Native, Firebase Firestore, SQLite, TanStack Query, TypeScript
- **핵심 과제:** Firestore의 읽기 비용을 최소화하면서도, 오프라인 지원과 완벽한 데이터 정합성(Consistency)을 보장하는 채팅 시스템 구축

---

## 2. 직면했던 문제 (The Challenge)

초기 개발 단계에서 단순한 `onSnapshot`(실시간 리스너) 구현만으로는 프로덕션 레벨의 요구사항을 충족하기 어렵다는 것을 발견했습니다. 특히 다음과 같은 세 가지 기술적 병목이 발생했습니다.

### 2.1. 비용과 성능의 딜레마 (Billing vs Performance)

채팅방 진입 시마다 전체 데이터를 `onSnapshot`으로 불러올 경우, 메시지 1개가 추가될 때마다 과거 데이터(limit 50)까지 중복 과금되는 **Read Cost Explosion** 문제가 있었습니다. 반대로 비용을 아끼려 구독을 제한하면 실시간성이 떨어지는 트레이드오프가 발생했습니다.

### 2.2. 데이터 단절 (Data Gap & Island)

로컬 캐싱(SQLite)을 도입했으나, 사용자가 오랫동안 오프라인 상태였다가 접속했을 때 **'로컬의 최신 데이터'와 '서버의 과거 데이터' 사이에 공백(Gap)**이 생기는 현상이 발생했습니다. 단순히 개수(`count`)만 체크하는 로직으로는 이 "데이터 섬(Island)" 현상을 탐지하지 못해 메시지가 누락되는 치명적인 UX 이슈가 있었습니다.

### 2.3. 비동기 라이프사이클의 함정 (Async Lifecycle)

`useEffect` 내부에서 `async` 함수로 구독을 설정할 때, Promise 반환 시점과 컴포넌트 언마운트 시점의 불일치(Race Condition)로 인해 **메모리 누수(Memory Leak)** 및 구독 해제 실패 현상을 겪었습니다.

---

## 3. 해결 과정 및 아키텍처 (Architecture & Solution)

이 문제를 해결하기 위해 **'Local-First, Server-Sync'** 전략을 수립하고 다음과 같이 아키텍처를 고도화했습니다.

### 3.1. SSOT (Single Source of Truth) 원칙 적용 - Repository Pattern

UI가 서버 데이터를 직접 바라보지 않게 했습니다. 모든 데이터 흐름은 **[Server -> SQLite -> UI]**로 단방향화했습니다.

- **이점:** 서버 데이터를 SQLite에 '던져놓기(Insert)'만 하면, 중복 제거와 정렬은 DB 엔진이 담당하므로 UI 로직이 획기적으로 단순해졌습니다.

### 3.2. 하이브리드 동기화 전략 (Hybrid Sync Strategy)

비용 절감과 최신성 보장을 위해 초기 진입과 실시간 구독을 분리했습니다.

- **Initial Load:** 진입 시 `REST Fetch`로 최신 20건을 강제 조회하여 기준점을 잡습니다. (데이터 정합성 확보)
- **Subscription:** 이후 도착하는 메시지는 `lastCreatedAt` 타임스탬프를 기준으로 `onSnapshot`을 연결해 델타(Delta) 업데이트만 수행합니다. (비용 최소화)

### 3.3. '시간의 연속성'을 이용한 Gap Filling (Data Continuity)

단순히 로컬 데이터 개수가 부족할 때(`count < PAGE_SIZE`)만 페칭하는 것이 아니라, **'시간의 단절'**을 감지하는 로직을 추가했습니다.

- **로직:** `요청한 커서 시간(PageParam)`과 `실제 조회된 데이터 시간`의 차이(Diff)가 임계값(예: 5분)을 초과하면, 데이터가 중간에 유실된 것으로 간주하고 즉시 서버 페칭을 수행합니다.
- **결과:** 오랫동안 접속하지 않았던 사용자도 끊김 없는 채팅 경험을 제공받게 되었습니다.

### 3.4. 안전한 비동기 구독 패턴 (Safe Async Subscription)

`useEffect` 내에서 `async/await` 사용 시 클린업 함수가 올바르게 동작하도록 **Adapter Pattern**과 `isMounted` 플래그를 도입하여 좀비 리스너 문제를 원천 차단했습니다.

```typescript
// Refactored Hook Logic Example
useEffect(() => {
  let unsubscribe: Unsubscribe | undefined;
  let isMounted = true;

  const setup = async () => {
    const fn = await service.subscribe(...);
    if (isMounted) unsubscribe = fn;
    else fn(); // Race Condition 방지: 이미 언마운트됐다면 즉시 해제
  };

  setup();
  return () => { isMounted = false; unsubscribe?.(); };
}, [roomId]);
```

4. 성과 (Result)
   비용 절감: 불필요한 재구독과 중복 읽기를 제거하여 Firestore Read 비용을 약 40% 절감했습니다.

안정성: 네트워크가 불안정한 환경이나 앱을 껐다 켠 상황에서도 메시지 누락 0건을 달성했습니다.

UX 개선: 로컬 캐시를 우선 보여주되(Stale-While-Revalidate), 백그라운드 동기화를 통해 **'로딩 없는 즉각적인 화면 진입'**을 구현했습니다.

5. 회고 및 배운 점 (Lessons Learned)
   이번 기능을 개발하며 **"Happy Path(정상적인 상황)만 코딩하는 것은 주니어의 영역"**임을 깨달았습니다.

진정한 엔지니어링은 네트워크 지연, 데이터 공백, 과금 정책과 같은 Edge Case를 다루는 데 있었습니다. 특히, "로컬에 데이터가 있으니 서버 요청을 안 해도 된다"는 직관이 틀릴 수 있음을 인정하고, Time Gap Check와 같은 방어 로직을 설계하는 과정에서 시스템 설계 능력을 한 단계 높일 수 있었습니다.

앞으로도 사용자에게는 단순함을 제공하고, 내부적으로는 견고한(Robust) 시스템을 구축하는 개발자가 되고자 합니다.
