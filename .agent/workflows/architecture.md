---
description: 이 프로젝트의 아키텍쳐
---

# 프로젝트 아키텍처 및 코딩 가이드라인

이 워크플로우는 프로젝트의 기능 추가, 스크린(화면) 리팩터링 및 API 연동 시 적용됩니다.

## 1. 코딩 가이드라인

- 기존 React Native 및 Expo Bare Workflow 구조를 따른다.
- 프로젝트의 ESLint 및 Prettier 규칙을 준수한다.
- React 컴포넌트 파일에서는 export되는 컴포넌트/핵심 로직을 먼저 배치하고, 보조 함수는 가능하면 컴포넌트 아래쪽에 둔다. 단, props 타입/상수처럼 컴포넌트 시그니처 이해에 바로 필요한 선언은 위에 둘 수 있다.

## 2. API 레이어 분리 (Remote × Service)

| 레이어 | 역할 | 위치 예시 |
| :--- | :--- | :--- |
| **Remote** | Firebase/HTTP 등 **데이터 페치·저장**만 담당. 쿼리/뮤테이션 호출, 페이징, 원시 응답 반환 | `app/features/<feature>/data/*Remote*.ts` |
| **Service** | **정책·검증·도메인 변환** 담당. 권한 체크, payload 조립, timestamp 변환, Alert/에러 메시지 등 | `app/features/<feature>/service/*Service.ts` |

- Screen, Hook, React Query `queryFn`/`mutationFn`은 **Remote를 직접 호출하지 않는다.** Service를 경유한다.
- Remote에는 비즈니스 정책(예: `TEST 계정 수정 불가`, `accountStatus` 분기)을 넣지 않는다.
- Service는 Remote 결과를 앱 도메인 타입으로 변환한 뒤 반환한다.

```text
Screen / Hook (React Query)
    ↓
Service  ← 정책, 검증, 변환
    ↓
Remote   ← Firestore/HTTP 페치
```

참고: `userRemote.firebase.ts` + `userService.ts`, `chatRemote.firebase.ts` + `chatService.ts`

## 3. 메인 스크린 비즈니스 로직 분리

메인 스크린(`*Screen.tsx`)은 **UI 렌더링**에 집중한다. 데이터 조회·상태·네비게이션·검색/필터 등 비즈니스 로직은 분리한다.

| 담당 | 역할 | 위치 예시 |
| :--- | :--- | :--- |
| **Screen** | 레이아웃, 리스트/폼 UI, 로딩·empty 분기 | `app/features/<feature>/screens/*Screen.tsx` |
| **Custom Hook** | 화면 단위 상태 조합, debounce, 네비게이션, `isLoading` 합성 | `app/features/<feature>/hooks/use*Screen.ts` |
| **React Query Hook** | 서버 상태, infinite query, cache key, `enabled` 조건 | `app/features/<feature>/hooks/use*Infinite.ts`, `use*Query.ts` |

- Screen 파일에 `useState` + fetch + filter + navigate가 한곳에 모이면, **Custom Hook(`useXxxScreen`)으로 옮긴다.**
- 서버 데이터는 React Query(`useInfiniteQuery`, `useQuery`, `useMutation`)로 관리하고, Screen/비즈니스 훅은 그 결과만 소비한다.
- Screen에서 Remote/Service를 직접 import하지 않는다.

참고: `UsersScreen.tsx` → `useUsersScreen.ts` → `useUsersInfinite.ts` → `userService`
