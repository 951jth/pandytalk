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
