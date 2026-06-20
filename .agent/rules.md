# AI 에이전트 마스터 룰 & 가이드라인

이 파일은 이 저장소에서 작업하는 AI 에이전트에게 최우선으로 적용되는 프로젝트 룰을 정의합니다.

## 1. 워크플로우 선행 확인 규칙

모든 사용자 요청에 대해, 먼저 `.agent/workflows/` 에 관련 워크플로우가 있는지 확인해야 합니다.

아래 내용이 포함된 요청에는 반드시 관련 워크플로우를 먼저 읽은 후에 답변하거나 명령을 실행하세요:

- git, commit, push, branch, merge, pull request
- release, 버전 업, 빌드 번호, runtime version, EAS Build, EAS Update
- deploy, update, publish, 회고록, 프로젝트 자동화

워크플로우가 적용되는 경우:

1. 명령을 제안하거나 설명하기 전에 워크플로우 파일을 먼저 읽는다.
2. 일반적인 에이전트 기본 동작보다 워크플로우를 우선 따른다.
3. 응답에서 사용한 워크플로우 파일을 명시한다.
4. 프로젝트 워크플로우에 명령 형식이 정의되어 있다면, 기억에 의존해서 답변하지 않는다.
5. 사용자가 명시적으로 실행을 요청하지 않는 한, `git commit` 또는 `git push`를 임의로 실행하지 않는다.

알려진 워크플로우 파일:

- `.agent/workflows/pushAndCommit.md`
- `.agent/workflows/release-versioning.md`
- `.agent/workflows/eas-update.md`
- `.agent/workflows/retrospective.md`

## 2. 워크플로우 매핑표

| 작업 유형 | 적용 워크플로우 |
| :--- | :--- |
| 푸시 또는 커밋 | `.agent/workflows/pushAndCommit.md` |
| 버전 업 또는 릴리즈 버전 관리 | `.agent/workflows/release-versioning.md` |
| EAS Update 또는 OTA 업데이트 | `.agent/workflows/eas-update.md` |
| 프로젝트 회고록 작성 | `.agent/workflows/retrospective.md` |

## 3. 커뮤니케이션 규칙

- 설명, 요약, 명령 제안은 한국어를 기본으로 사용한다.
- 한국어 텍스트는 주의 깊게 보존한다. 작업에 필요한 경우가 아니라면 한국어 내용을 재작성하거나 정규화하거나 교체하지 않으며, 인코딩 손상(mojibake)을 유발할 수 있는 편집은 피한다.
- 커밋 메시지는 Conventional Commits 형식을 따른다.
- 명령 제안은 마크다운 코드 블록으로 바로 복사할 수 있게 제공한다.
- 워크플로우가 적용된 경우, 어떤 워크플로우를 사용했는지 응답에 명시한다.

## 4. 안전 가드레일

- `rm`, `git reset`, `git push -f`, `npm publish` 등 파괴적인 명령은 사용자의 명시적 승인 없이 실행하지 않는다.
- 네이티브 파일(`android/`, `ios/`, `app.json`, `app.config.js`, `package.json` 등)이 변경된 경우, 네이티브 빌드 또는 EAS Build/Update가 필요할 수 있음을 명확히 경고한다.
- 커밋 및 푸시 요청 시, 최종 명령을 제안하기 전에 `git status`를 먼저 실행하거나 그 결과를 요약한다.
- 한국어가 포함된 파일을 읽을 때는 `Get-Content -Encoding UTF8` 등 UTF-8을 인식하는 명령을 사용하고, 터미널 출력에서 mojibake가 보인다고 해서 한국어 텍스트가 손상되었다고 판단하지 않는다.
- 명시적으로 요청받지 않는 한, 한국어 주석이나 문자열을 임의로 재작성하지 않는다.

## 5. 기술 규칙

- 기존 React Native 및 Expo Bare Workflow 구조를 따른다.
- 프로젝트의 ESLint 및 Prettier 규칙을 준수한다.
- 작은 TypeScript/React Native 변경에서 사용자가 빠른 진행을 원하거나 원인 분석/계획 검토가 주된 요청인 경우, `npm run typecheck`, `npx eslint`, 전체 테스트처럼 구동 시간이 긴 검증 명령은 자동 실행하지 않는다. 필요하면 변경 파일을 정적으로 점검하고, 무거운 검증은 사용자에게 먼저 확인한 뒤 실행한다.
- Windows sandbox에서 `npm`/`npx` 검증 명령이 `spawn setup refresh` 등 실행 준비 단계 오류로 실패한 경우, 같은 검증을 즉시 승인 재실행하지 않는다. 사용자가 검증 실행을 명시적으로 원할 때만 재시도한다.
- `npm`, `npx`, `yarn`, Gradle, EAS, iOS/Android 빌드, 전체 테스트, 전체 lint/typecheck처럼 오래 걸릴 수 있는 명령은 사용자가 명시적으로 요청하지 않는 한 자동 실행하지 않는다. 검증이 필요하다고 판단되면 먼저 어떤 명령을 왜 실행해야 하는지 짧게 설명하고 사용자 허가를 받은 뒤 실행한다.
- 대규모 변경 사항은 편집 전에 구현 계획을 작성하거나 사용자에게 확인한다.
- React 컴포넌트 파일에서는 export되는 컴포넌트/핵심 로직을 먼저 배치하고, 보조 함수는 가능하면 컴포넌트 아래쪽에 둔다. 단, props 타입/상수처럼 컴포넌트 시그니처 이해에 바로 필요한 선언은 위에 둘 수 있다.

## 6. API 및 화면 아키텍처 규칙

새 API를 추가하거나 기존 API를 수정할 때, 메인 스크린을 구현·리팩터링할 때 아래 레이어 구조를 따른다.

### 6-1. API 레이어 분리 (Remote × Service)

| 레이어 | 역할 | 위치 예시 |
| :--- | :--- | :--- |
| **Remote** | Firebase/HTTP 등 **데이터 페치·저장**만 담당. 쿼리/뮤테이션 호출, 페이징, 원시 응답 반환 | `app/features/<feature>/data/*Remote*.ts` |
| **Service** | **정책·검증·도메인 변환** 담당. 권한 체크, payload 조립, timestamp 변환, Alert/에러 메시지 등 | `app/features/<feature>/service/*Service.ts` |

- Screen, Hook, React Query `queryFn`/`mutationFn`은 **Remote를 직접 호출하지 않는다.** Service를 경유한다.
- Remote에는 비즈니스 정책(예: `TEST 계정 수정 불가`, `accountStatus` 분기)을 넣지 않는다.
- Service는 Remote 결과를 앱 도메인 타입으로 변환한 뒤 반환한다.

```
Screen / Hook (React Query)
    ↓
Service  ← 정책, 검증, 변환
    ↓
Remote   ← Firestore/HTTP 페치
```

참고: `userRemote.firebase.ts` + `userService.ts`, `chatRemote.firebase.ts` + `chatService.ts`

### 6-2. 메인 스크린 비즈니스 로직 분리

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

> 중요: 사용자가 "알아서 해줘"라고 말하더라도, 적용 가능한 워크플로우 단계를 건너뛰지 않는다.
