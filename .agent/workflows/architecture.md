---
description: 이 프로젝트의 아키텍쳐
---

# Feature-Based Architecture 및 코딩 가이드라인

이 워크플로우는 프로젝트의 기능 추가, 스크린(화면) 리팩터링 및 API 연동 시 적용됩니다.

## 1. 코딩 가이드라인

- 기존 React Native 및 Expo Bare Workflow 구조를 따른다.
- 프로젝트의 ESLint 및 Prettier 규칙을 준수한다.
- React 컴포넌트 파일에서는 export되는 컴포넌트/핵심 로직을 먼저 배치하고, 보조 함수는 가능하면 컴포넌트 아래쪽에 둔다. 단, props 타입/상수처럼 컴포넌트 시그니처 이해에 바로 필요한 선언은 위에 둘 수 있다.

## 2. Feature-Based Architecture

### 2.1 기본 구조와 의존 방향

기능 코드는 `app/features/<feature>/` 아래에 두고, feature 내부에서 화면·상태 조합·도메인 정책·데이터 접근을 함께 관리한다.

```text
bootstrap / navigation / layout / store  ← 앱 조립 계층
                    ↓
                 features                ← 기능 계층
                    ↓
                  shared                 ← 기능을 모르는 공통 계층
```

- `bootstrap`, `navigation`, `layout`, `store`는 앱 조립을 위해 feature를 import할 수 있다.
- feature는 `shared`를 import할 수 있다.
- `shared`는 어떤 feature도 import하지 않는다.
- 특정 feature 의미를 알아야 하는 코드는 `shared`가 아니라 해당 feature에 둔다.
- 두 곳에서 사용된다는 이유만으로 `shared`로 이동하지 않는다. 기능 의미가 없고 변경 이유가 공통일 때만 승격한다.
- 도메인 타입은 기본적으로 해당 feature에 둔다. 여러 feature가 소유권 없이 공유하는 앱 공통 계약만 `shared/types`에 둔다.

### 2.2 Feature 내부 구조

필요한 폴더만 만들며, 빈 디렉터리를 구조 맞추기 목적으로 미리 만들지 않는다.

```text
app/features/<feature>/
├─ components/  ← feature 전용 UI
├─ screens/     ← 라우트 진입 화면
├─ hooks/       ← 화면 조합, React Query, mutation, subscription
├─ service/     ← 정책, 검증, 도메인 변환, 데이터 조합
├─ data/        ← Firebase/HTTP/SQLite 등 실제 입출력
├─ policies/    ← 부수효과 없는 도메인 판단
├─ types/       ← feature 소유 타입
├─ utils/       ← feature 내부 순수 유틸리티
└─ test/        ← feature 단위 테스트
```

### 2.3 Feature 간 참조

- 같은 feature 내부에서는 해당 feature의 세부 경로를 직접 import할 수 있다.
- 다른 feature를 참조해야 하면 상대 feature의 공개 API(`app/features/<feature>/index.ts`)를 우선 사용한다.
- 다른 feature의 `data/`를 직접 import하지 않는다.
- 다른 feature의 내부 Component·Hook·Service를 임의로 참조하지 않는다. 교차 사용이 의도된 항목만 공개 API에서 export한다.
- 순환 의존이 생기면 공개 API를 늘리지 말고 조립 책임을 `bootstrap`, `navigation`, 상위 Screen 또는 별도 orchestration 계층으로 이동한다.

```ts
// 권장: 다른 feature가 공개한 계약 사용
import {userService, type User} from '@app/features/user'

// 지양: 다른 feature 내부 경로에 직접 결합
import {userService} from '@app/features/user/service/userService'
```

기존 교차 참조는 한 번에 전체 이동하지 않는다. 신규 코드와 수정하는 경로부터 공개 API를 적용하고, 관련 없는 legacy 파일은 별도 작업으로 남긴다.

## 3. API 레이어 분리 (Remote/Local × Service)

| 레이어 | 역할 | 위치 예시 |
| :--- | :--- | :--- |
| **Remote/Local** | Firebase/HTTP/SQLite 등 **데이터 페치·저장**만 담당. 쿼리/뮤테이션 호출, 페이징, 원시 응답 반환 | `app/features/<feature>/data/*Remote*.ts`, `*Local*.ts` |
| **Service** | **정책·검증·도메인 변환** 담당. 권한 체크, payload 조립, timestamp 변환, Alert/에러 메시지 등 | `app/features/<feature>/service/*Service.ts` |

- Screen, Component, Hook, React Query `queryFn`/`mutationFn`은 **Remote/Local을 직접 호출하지 않는다.** Service를 경유한다.
- Remote/Local에는 비즈니스 정책(예: `TEST 계정 수정 불가`, `accountStatus` 분기)을 넣지 않는다.
- Service는 Remote/Local 결과를 앱 도메인 타입으로 변환한 뒤 반환한다.
- `utils/`, `types/`, `policies/`는 데이터 접근이나 UI 부수효과를 갖지 않는다.

```text
Screen / Hook (React Query)
    ↓
Service  ← 정책, 검증, 변환
    ↓
Remote / Local  ← Firestore/HTTP/SQLite 입출력
```

참고: `userRemote.firebase.ts` + `userService.ts`, `chatRemote.firebase.ts` + `chatService.ts`

## 4. Screen과 Hook 책임

메인 스크린(`*Screen.tsx`)은 UI 렌더링에 집중하되, 작은 화면 조합을 무조건 별도 Screen Hook 파일로 추출하지 않는다.

| 담당 | 역할 | 위치 예시 |
| :--- | :--- | :--- |
| **Screen** | 레이아웃, 리스트/폼 UI, 로딩·empty 분기 | `app/features/<feature>/screens/*Screen.tsx` |
| **Custom Hook** | 재사용되는 상태 조합, debounce, 복합 정책, `isLoading` 합성 | `app/features/<feature>/hooks/use*.ts` |
| **React Query Hook** | 서버 상태, infinite query, cache key, `enabled` 조건 | `app/features/<feature>/hooks/use*Infinite.ts`, `use*Query.ts` |

- Screen은 소수의 Hook 호출, `useMemo`, `useCallback`, 단순 네비게이션을 직접 조합할 수 있다.
- 여러 `useState`/`useEffect`, 복수 데이터 소스, 권한 정책, mutation/subscription, 복잡한 로딩·에러 합성이 함께 생기면 Custom Hook으로 추출한다.
- 재사용되지 않는 화면 전용 Hook은 같은 Screen 파일의 private Hook으로 둘 수 있다.
- 다른 화면에서도 재사용되거나 독립 테스트가 필요하거나 파일이 과도하게 커지면 `hooks/`로 이동한다.
- 단순히 DM/그룹 등 파일 모양을 맞추기 위해 동일한 Screen Hook 계층을 강제하지 않는다.
- 서버 데이터는 React Query(`useInfiniteQuery`, `useQuery`, `useMutation`)로 관리하고, Screen/비즈니스 훅은 그 결과만 소비한다.
- Screen에서 Remote/Service를 직접 import하지 않는다.

참고: `UsersScreen.tsx` → `useUsersScreen.ts` → `useUsersInfinite.ts` → `userService`

## 5. Import와 점진 적용

- 프로젝트 내부 import는 `@app`, `@features`, `@shared` 등 설정된 alias를 우선 사용한다.
- TypeScript와 Babel의 alias 정의는 항상 같은 실제 경로를 가리켜야 한다.
- 신규·수정 코드에는 이 문서의 FBA 규칙을 적용한다.
- 관련 없는 legacy 위반을 같은 작업에서 함께 정리하지 않는다.
- 기존 경계를 옮길 때는 현재 import/call path를 먼저 확인하고, 데이터·API·화면 책임을 한 번에 바꾸지 않는다.
- 대규모 폴더 이동이나 public API 도입은 기능 단위로 나누고 각 단계에서 `git diff --check`, 대상 ESLint, 필요한 테스트를 수행한다.
