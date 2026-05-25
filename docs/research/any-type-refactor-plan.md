# any 타입 정리 계획

## 개요

현재 프로젝트의 TS/TSX 코드에서 명시적 `any` 사용처는 43개 파일, 108곳이다.

현재 TypeScript 설정은 `strict: true`이지만, ESLint에서는 `@typescript-eslint/no-explicit-any`가 `warn`으로 설정되어 있다. 따라서 지금의 목표는 모든 `any`를 한 번에 제거하는 것이 아니라, 런타임 데이터 경계와 공용 타입부터 안전하게 좁히는 것이다.

## 우선순위

### 1. 네비게이션 타입

대상 파일:

- `app/navigation/RootNavigation.ts`
- `app/navigation/AppNavigator.tsx`
- `app/navigation/TabScreenNavigator.tsx`
- `app/shared/types/navigate.ts`

수정 방향:

- `createNavigationContainerRef<any>()`를 `RootStackParamList` 기반 타입으로 교체한다.
- Stack, Tab navigator에 이미 정의된 `AppRouteParamList`, `TabParamList`를 적용한다.
- `props: any`, `React.ComponentType<any>`를 React Navigation screen props 타입으로 좁힌다.

기대 효과:

- 라우트 이름과 params 불일치를 컴파일 타임에 잡을 수 있다.
- 비교적 영향 범위가 명확해서 첫 작업으로 적합하다.

### 2. 채팅/AI 도메인 타입

대상 파일:

- `functions/src/types/chat.ts`
- `functions/src/services/aiChatService.ts`
- `functions/src/triggers/chats/onAiStream.ts`
- `functions/src/triggers/chats/onAiStreamBackup.ts`
- `functions/src/utils/aiUtils.ts`

수정 방향:

- functions 쪽 `ChatRoom.lastMessage?: any`, `recentMessages?: any[]`를 구체 타입으로 교체한다.
- 앱 쪽 `ChatRoom.recentMessages?: {role: 'user' | 'assistant'; content: string}[]`와 functions 타입을 맞춘다.
- AI 메시지 히스토리 타입을 별도로 정의한다.
- `catch (err: any)`는 `unknown`으로 받고 에러 메시지를 추출하는 헬퍼를 사용한다.

기대 효과:

- AI 스트리밍, 최근 메시지 저장, 푸시 메시지 구성에서 데이터 모양이 흔들리는 문제를 줄일 수 있다.
- 앱과 Cloud Functions 사이의 채팅 모델 불일치를 줄일 수 있다.

### 3. Firebase / 외부 API 경계

대상 파일:

- `app/shared/firebase/firebaseUtils.ts`
- `app/features/user/data/userRemote.firebase.ts`
- `app/features/notification/service/fcmService.ts`
- `functions/src/services/aiService.ts`
- `functions/src/utils/fcm.ts`

수정 방향:

- 외부에서 들어오는 값은 `any` 대신 `unknown`으로 받는다.
- Firestore payload는 `Record<string, unknown>` 또는 도메인별 update payload 타입으로 제한한다.
- `response.json() as any`는 응답 타입 인터페이스를 정의한 뒤 필요한 필드만 좁힌다.
- `removeEmptyValues(obj: any): any`는 제네릭 또는 `Record<string, unknown>` 기반으로 변경한다.

기대 효과:

- 외부 API 응답 구조 변경이나 Firestore 문서 형태 오류를 더 빨리 발견할 수 있다.
- 무분별한 payload 전달을 줄일 수 있다.

### 4. SQLite 타입

대상 파일:

- `app/shared/sqlite/sqlite.ts`
- `app/shared/utils/data.ts`
- `app/features/chat/data/messageLocal.sqlite.ts`
- `app/features/chat/data/messageLocal.test.sqlite.ts`
- `app/shared/types/react-native-sqlite-storage.d.ts`

수정 방향:

- 커스텀 SQLite 타입 선언을 먼저 보강한다.
- `tx: any`, `err: any`, `params: any[]`를 `Transaction`, SQL value 타입, SQLite error 타입으로 좁힌다.
- row parsing 구간은 `unknown` 또는 전용 row 타입으로 받은 뒤 `ChatMessage`로 변환한다.

기대 효과:

- SQLite executeSql 콜백의 타입 안정성이 올라간다.
- 로컬 메시지 캐시 변환 로직에서 필드 누락과 JSON 파싱 오류를 더 명확히 다룰 수 있다.

### 5. 폼 시스템 타입

대상 파일:

- `app/shared/types/form.ts`
- `app/shared/ui/form/InputForm.tsx`
- `app/shared/ui/form/InputFormRow.tsx`
- `app/shared/ui/form/hooks/useInputForm.ts`
- `app/shared/utils/validation.ts`

수정 방향:

- `FormValue` 타입을 정의한다.
- `render`, `onChange`, `validation.customFn`의 입출력 타입을 좁힌다.
- `[key: string]: any`는 가능하면 별도 `extraProps` 구조로 분리하거나 `unknown`으로 낮춘다.
- `newErrors: any`는 `Record<string, string>` 또는 현재 에러 구조에 맞는 타입으로 바꾼다.

기대 효과:

- 공용 폼 컴포넌트의 호출부 실수를 줄일 수 있다.
- 영향 범위가 넓기 때문에 앞 단계 타입 정리 후 진행하는 것이 안전하다.

### 6. 범용 유틸과 테스트

대상 파일:

- `app/shared/utils/data.ts`
- `app/shared/utils/format.ts`
- `app/shared/utils/call.ts`
- `app/shared/test/chat.test.ts`
- `app/shared/test/mocks.ts`
- `app/features/chat/test/*.test.ts`
- `app/shared/types/images.d.ts`

수정 방향:

- 범용 유틸은 `Record<string, unknown>`과 제네릭을 조합해 점진적으로 교체한다.
- 테스트의 `as any`는 테스트 factory 또는 helper 타입으로 줄인다.
- 이미지 모듈 선언은 `ImageSourcePropType` 사용을 검토한다.

기대 효과:

- 핵심 런타임 코드 정리 후 남은 경고를 줄일 수 있다.
- 테스트 코드의 과도한 캐스팅을 줄여 fixture 신뢰도를 높일 수 있다.

## 권장 작업 순서

1. 네비게이션 타입 정리
2. 채팅/AI 도메인 타입 정리
3. Firebase와 외부 API 경계 타입 정리
4. SQLite 타입 선언 및 로컬 메시지 변환 타입 정리
5. 폼 시스템 타입 정리
6. 범용 유틸, 테스트, 선언 파일 정리
7. `@typescript-eslint/no-explicit-any`를 `warn`에서 `error`로 올릴 수 있는지 검토

## 검증 방법

각 단계마다 다음 명령을 기준으로 확인한다.

```bash
yarn typecheck
yarn lint --quiet
```

채팅, SQLite, AI 스트리밍 관련 타입을 수정한 단계에서는 관련 테스트도 함께 실행한다.

```bash
yarn test app/features/chat/test
yarn test app/shared/test
```

## 주의사항

- 한국어 주석과 문자열은 타입 정리 과정에서 임의로 재작성하지 않는다.
- `any`를 무조건 `unknown`으로 바꾸는 것만으로는 충분하지 않다. 외부 데이터 경계에서는 검증 또는 타입 좁히기 로직이 함께 필요하다.
- 공용 유틸과 폼 타입은 호출부 영향이 크므로 마지막에 진행한다.
- 테스트의 `as any`는 실제 런타임 코드의 `any`보다 우선순위를 낮게 둔다.

## 2026-05-25 현재 잔여 점검 결과

검증 결과:

- `yarn.cmd typecheck`: 통과
- `yarn.cmd lint --quiet`: 통과
- 앱/Functions TS 계열 파일의 `any`: 88곳
- 앱/Functions TS/TSX 파일의 `console.log/debug/info/warn/error`: 131곳

비고:

- PowerShell에서는 `yarn`이 실행 정책에 막힐 수 있으므로 로컬 점검 시 `yarn.cmd`를 사용한다.
- 앱 ESLint는 `no-console: off`, Functions ESLint는 `no-console: warn`이다.
- `@typescript-eslint/no-explicit-any`는 앱 ESLint에서만 `warn`으로 설정되어 있고, Functions ESLint에는 아직 명시되어 있지 않다.
- 네비게이션 대상 파일에서는 현재 `any`가 검색되지 않고, `app/navigation/RootNavigation.ts`의 `console.warn` 1곳만 남아 있다.

## 현재 기준 남은 작업 계획

### 1. Functions 채팅/AI 타입 정리 - 완료

대상:

- `functions/src/types/chat.ts`
- `functions/src/services/aiChatService.ts`
- `functions/src/services/aiService.ts`
- `functions/src/utils/aiUtils.ts`
- `functions/src/triggers/chats/onAiStream.ts`
- `functions/src/triggers/chats/onAiStreamBackup.ts`
- `functions/src/triggers/test/aiStreamBenchmark.ts`

작업:

- `ChatRoom.lastMessage`, `recentMessages`를 앱 쪽 실제 저장 형태와 맞춘 타입으로 교체했다.
- AI 히스토리 메시지 타입을 Functions 공용 타입으로 분리했다.
- OpenAI content part, 검색 API 응답, SSE 에러 payload는 `unknown`에서 필요한 필드만 좁히도록 바꿨다.
- `catch (err: any)`는 `unknown`으로 받고 에러 메시지 추출 헬퍼를 사용하도록 바꿨다.
- 대상 파일의 명시적 `any`는 0건이다.

검증:

```bash
yarn.cmd typecheck
cd functions && npm run build
```

완료 검증:

```bash
yarn.cmd typecheck
cd functions && npm.cmd run build
```

비고:

- PowerShell에서는 `npm`도 실행 정책에 막힐 수 있으므로 `npm.cmd`를 사용한다.
- `cd functions && npm.cmd run lint`는 현재 `functions/lib` 빌드 산출물까지 검사하면서 기존 quote/semi 오류가 대량으로 발생한다.
- `functions/src`만 대상으로 한 `npx.cmd eslint src --ext .ts`도 기존 다른 파일의 quote/no-undef/no-console 이슈로 실패한다. 이번 단계에서 수정한 대상 파일의 `any`는 제거 완료했다.

### 2. Firebase / 외부 데이터 경계 타입 정리

대상:

- `app/shared/firebase/firebaseUtils.ts`
- `app/features/user/data/userRemote.firebase.ts`
- `app/features/user/service/userService.ts`
- `app/features/notification/service/fcmService.ts`
- `functions/src/utils/fcm.ts`

작업:

- Firestore update payload를 `Record<string, unknown>` 또는 도메인별 payload 타입으로 제한한다.
- `createdAt: any`, `profile as any`, `payload as any`를 실제 Timestamp/update 타입으로 교체한다.
- `removeEmptyValues(obj: any): any`는 제네릭 기반 또는 `Record<string, unknown>` 기반으로 바꾼다.
- 사용자 탈퇴/FCM 토큰 처리의 `catch` 타입을 `unknown`으로 낮춘다.

검증:

```bash
yarn.cmd typecheck
yarn.cmd lint --quiet
cd functions && npm run build
```

### 3. SQLite 타입 선언과 로컬 메시지 변환 정리

대상:

- `app/shared/types/react-native-sqlite-storage.d.ts`
- `app/shared/sqlite/sqlite.ts`
- `app/shared/utils/data.ts`
- `app/features/chat/data/messageLocal.sqlite.ts`
- `app/features/chat/data/messageLocal.test.sqlite.ts`

작업:

- SQLite row, params, error 타입을 먼저 선언 파일에서 보강한다.
- `params: any[]`, `Promise<any>`, `tx: any`, `err: any`를 SQL value, result, transaction 타입으로 교체한다.
- `messageLocal.sqlite.ts`의 `(item as any).imageUrls`는 row 타입을 둔 뒤 `ChatMessage`로 변환한다.

검증:

```bash
yarn.cmd typecheck
yarn.cmd test app/features/chat/test
```

### 4. 폼 시스템과 범용 유틸 타입 정리

대상:

- `app/shared/types/form.ts`
- `app/shared/ui/form/InputForm.tsx`
- `app/shared/ui/form/InputFormRow.tsx`
- `app/shared/ui/form/hooks/useInputForm.ts`
- `app/shared/utils/validation.ts`
- `app/shared/utils/format.ts`
- `app/shared/utils/call.ts`
- `app/shared/utils/data.ts`

작업:

- `FormValue`, `FormValues`, `FormMeta` 타입을 정의한다.
- `render`, `onChange`, `customFn`, `newErrors`의 입출력을 구체화한다.
- 범용 path 유틸은 `unknown`과 제네릭을 조합해 호출부가 필요한 타입을 직접 넘기게 한다.
- `safeCall`은 `Promise<unknown>` 또는 제네릭 반환 타입으로 바꾼다.

검증:

```bash
yarn.cmd typecheck
yarn.cmd lint --quiet
```

### 5. 피처 단위 잔여 `any` 정리

대상:

- `app/features/group/service/groupService.ts`
- `app/features/group/hooks/useGroupQuery.ts`
- `app/features/group/components/GroupForm.tsx`
- `app/features/user/hooks/useUsersInfinite.ts`
- `app/features/user/components/UserManageModal.tsx`
- `app/features/chat/service/aiService.ts`
- `app/features/chat/service/messageService.ts`
- `app/features/chat/hooks/useAiStreamResponse.ts`
- `app/features/chat/hooks/useChatMessagesInfinite.ts`
- `app/shared/ui/skeleton/Skeleton.tsx`
- `app/shared/types/images.d.ts`

작업:

- React Query `pageParam`과 pagination cursor 타입을 도메인별로 정의한다.
- `record as any` 접근은 공용 식별자 타입 또는 타입 가드로 교체한다.
- `Skeleton`의 width/height는 React Native 스타일 타입에 맞게 좁힌다.
- 이미지 모듈 선언은 `ImageSourcePropType`으로 교체 가능한지 확인한다.

### 6. 테스트 `any` 정리

대상:

- `app/shared/test/chat.test.ts`
- `app/shared/test/mocks.ts`
- `app/features/chat/test/message.test.ts`
- `app/features/chat/test/useChatMessagesInfinite.test.ts`

작업:

- Timestamp mock factory를 만들어 `as any` 반복을 줄인다.
- 테스트 fixture 전용 타입을 추가한다.
- 런타임 코드 정리가 끝난 뒤 마지막에 진행한다.

검증:

```bash
yarn.cmd test app/shared/test
yarn.cmd test app/features/chat/test
```

## 불필요한 console 정리 계획

### 유지 후보

- `app/shared/services/logger.ts`: 로거 구현부이므로 유지한다. 단, `logger` 사용처를 늘린 뒤 직접 console 사용을 줄인다.
- `app/features/chat/data/messages.schema.ts`: 마이그레이션 로그는 개발/장애 분석 가치가 있어 유지하거나 `logger.info`로 전환한다.
- Cloud Functions 트리거의 운영 이벤트 로그: Firebase Functions 로그로 남길 필요가 있는 것은 유지하되 메시지 형식을 정리한다.
- `app/features/chat/utils/aiPerfLogger.ts`, `app/shared/hooks/usePerformanceMeasure.ts`: 개발 전용 성능 측정이면 `__DEV__` 가드 또는 logger로 감싼다.

### 우선 제거 후보

- `app/shared/firebase/firebaseUtils.ts`: 23곳. 디버그 helper 성격이 강하므로 `__DEV__` 가드 또는 `logger`로 대체한다.
- `app/shared/utils/permission.ts`: `console.log('ok')`는 제거한다.
- `app/shared/utils/firebase.ts`: `console.log(creationTime, lastSignInTime)`는 제거 또는 logger debug로 전환한다.
- `app/features/harness/screens/HarnessScreen.tsx`: 버튼 테스트 로그는 개발 화면이라도 logger debug로 교체한다.
- `app/features/user/hooks/useProfileMenu.ts`: `all messages` 덤프 로그는 제거한다.
- `app/shared/ui/upload/EditProfile.tsx`: 권한/이미지 선택 디버그 로그는 logger 또는 제거로 정리한다.
- `app/features/chat/hooks/useChatMessageInput.ts`, `app/features/group/hooks/useGroupQuery.ts`, `app/features/chat/service/messageTestService.ts`: 단순 에러 덤프는 logger로 전환한다.

### console 정리 순서

1. 명백한 임시 로그 제거: `permission.ts`, `useProfileMenu.ts`, `HarnessScreen.tsx`, `EditProfile.tsx`
2. 앱 런타임 로그를 `logger`로 전환: 채팅/유저/그룹/알림 hook과 service
3. 디버그 유틸 로그에 `__DEV__` 가드 추가: Firebase debug helper, 성능 측정, 업데이트 체크
4. Functions 로그 정책 결정: 운영 로그는 유지, 임시 로그는 제거
5. ESLint 정책 조정 검토: 앱 `no-console`을 `warn`으로 올리고 `logger.ts` 등 예외 파일만 허용

검증:

```bash
yarn.cmd lint --quiet
yarn.cmd typecheck
```

## 완료 기준

1. 앱/Functions 런타임 코드의 `any`를 모두 제거하거나, 외부 경계 및 테스트처럼 불가피한 곳만 명시적으로 남긴다.
2. 직접 `console.*` 호출은 `logger.ts`, Functions 운영 로그, 마이그레이션/성능 측정처럼 의도가 분명한 곳으로 제한한다.
3. 앱 ESLint의 `@typescript-eslint/no-explicit-any`를 `error`로 올릴 수 있는지 확인한다.
4. 앱 ESLint의 `no-console`을 최소 `warn`으로 올리고 예외 파일 정책을 둔다.
