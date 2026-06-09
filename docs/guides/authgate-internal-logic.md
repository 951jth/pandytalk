# AuthGate 내부 로직 이해하기 (`onAuthStateChanged` & `isEffectActive`)

`useAuthGate.ts`는 앱 초기 실행 시 사용자의 인증 상태를 확인하고, 화면 진입(스플래시 -> 메인/로그인)을 결정하는 중요한 커스텀 훅입니다. 이 문서에서는 내부 핵심 로직인 `onAuthStateChanged`와 `isEffectActive` 변수의 역할에 대해 설명합니다.

---

## 1. `onAuthStateChanged` 로직의 역할

이 부분은 **Firebase의 인증 상태(로그인, 로그아웃, 앱 초기 실행 시 세션 복구 등)가 변경될 때마다 이를 감지하고 처리하는 핵심 로직**입니다. 

구체적인 동작 순서는 다음과 같습니다:

1. **인증 상태 감지**: Firebase 인증 상태가 바뀌면 리스너가 동작하여 현재 사용자(`user`) 객체를 받아옵니다.
2. **초기 상태 설정**: 로딩(초기화) 상태인 `initializing`을 `true`로 설정하고, 현재 Firebase 유저(`fbUser`) 상태를 업데이트합니다.
3. **분기 처리**:
   - **로그인되지 않은 경우 (유저가 없을 때)**: 아날리틱스 식별을 초기화하고, `initializing`을 `false`로 바꿔 스플래시 화면 대기를 종료합니다.
   - **로그인된 경우**: `user.uid`를 이용해 백엔드/Redux에서 사용자의 상세 프로필 정보를 비동기적으로 가져옵니다(`fetchProfile`). 이 과정에서 성공, 실패, 소요 시간 등을 아날리틱스로 로깅합니다.
4. **초기화 종료**: 프로필을 가져오는 작업이 끝나면(성공/실패 무관) `finally` 블록에서 `initializing`을 `false`로 변경하여, 앱이 스플래시 화면을 끝내고 인증 상태에 따라 실제 화면 진입(Snappy Logic)을 수행할 수 있도록 돕습니다.

---

## 2. `isEffectActive` 변수의 역할

이 변수는 **"현재 이 커스텀 훅(컴포넌트)이 화면에 렌더링되어(마운트되어) 있는가?"** 를 추적하여 **안전하게 상태(State)를 업데이트하기 위한 플래그(Flag) 변수**입니다. (React에서 흔히 쓰이는 Cleanup 패턴입니다.)

### 🤔 왜 필요한가요?
- `useEffect` 안에서 `fetchProfile`과 같은 **비동기 작업**을 하거나 Firebase 이벤트 리스너 콜백을 기다리는 동안, 사용자의 조작이나 다른 컴포넌트의 렌더링 변화로 인해 해당 컴포넌트가 화면에서 사라질 수 있습니다(언마운트).
- 만약 컴포넌트가 이미 사라졌는데 데이터 통신이 끝나고 `setInitializing(false)` 같은 React 상태 업데이트를 시도하면, React에서 **메모리 누수 위험 경고**나 에러가 발생하게 됩니다.

### 🛠️ 어떻게 작동하나요?
1. `useEffect`가 시작될 때 `isEffectActive = true`로 초기화합니다.
2. 컴포넌트가 언마운트되거나 의존성 배열이 바뀌어 Effect가 정리(Cleanup)될 때 클린업 함수에서 `isEffectActive = false`로 바꿉니다.
3. 비동기 로직 완료 시점이나 상태 업데이트 직전에 `if (!isEffectActive) return` 조건문으로 확인하여, **아직 컴포넌트가 살아있을 때만 React 상태(`setInitializing` 등)를 업데이트하도록 방어**해 줍니다.
