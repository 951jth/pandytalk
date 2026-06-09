# 🚀 푸시 네비게이션 로깅 및 에러 트래킹 가이드

앱에서 푸시 알림을 터치하여 채팅방으로 이동할 때 발생하는 이벤트를 추적하고, 예상치 못한 오류(콜드스타트 시 튕김 등)를 디버깅하기 위한 로깅 전략 가이드입니다.

현재 `RootNavigation.ts`의 `navigateToChat` 함수에는 두 가지 핵심 로깅 도구가 연동되어 있으며, 목적에 따라 **하이브리드(Hybrid)** 형태로 활용됩니다.

---

## 1. 두 가지 로깅 도구의 역할

### 📊 Firebase Analytics (`@app/shared/services/analytics`)
- **목적**: 마케팅, 통계, 퍼널(Funnel) 분석
- **특징**: "사용자가 푸시를 얼마나 많이 눌렀고, 성공적으로 채팅방까지 도달한 비율은 얼마인가?"를 알기 위해 사용합니다.
- **확인 방법**: Firebase 콘솔 > Analytics > Events 대시보드
- **수집 중인 이벤트**:
  - `nav_chat_attempt`: 푸시를 누르고 채팅방 진입 시도 시
  - `nav_chat_success`: 네비게이션 액션 성공 시
  - `nav_chat_failed`: 앱 내부 오류로 네비게이션 실패 시

### 🛠️ Firebase Crashlytics (`@app/shared/services/logger`)
- **목적**: 에러 수집 및 디버깅 (발자취 남기기)
- **특징**: 치명적인 에러가 발생하기 직전, 앱이 어떤 상태였는지 **빵부스러기(Breadcrumbs)**를 남겨 원인을 즉시 파악할 수 있게 해줍니다.
- **확인 방법**: Firebase 콘솔 > Crashlytics > 비정상 종료/오류 탭
- **수집 중인 상태 로그**:
  - `[INFO] navigateToChat Attempt`: 진입 시도 시 파라미터 및 앱 준비 상태(`isNavReady`, `isSplashFinished`) 기록
  - `[INFO] navigateToChat Queued`: 아직 스플래시가 끝나지 않아 큐에 저장된 상태 기록
  - `[INFO] navigateToChat Executing Task`: 실제 React Navigation을 통해 화면 이동 명령을 내린 상태
  - `[ERROR] navigateToChat Failed internally`: 에러 로그

---

## 2. 오류 제보가 들어왔을 때 디버깅하는 방법

1. 사용자가 **"푸시를 눌러도 반응이 없어요"** 또는 **"앱만 켜지고 채팅방으로 안 들어가져요"**라고 제보합니다.
2. Firebase Crashlytics 콘솔에 들어갑니다.
3. 이슈 목록에서 해당 시점에 발생한 로그를 찾아 클릭합니다.
4. 함께 첨부된 **[Logs] (로그 발자취)** 탭을 엽니다.
5. **로그 패턴 분석**:

### 케이스 A: 큐에서 막힌 경우 (스플래시 대기 무한루프)
로그가 다음과 같이 찍혀있다면:
> `[INFO] navigateToChat Attempt { isNavReady: false, isSplashFinished: false }`  
> `[INFO] navigateToChat Queued (Waiting for App Setup)`

💡 **결론 도출**: "큐에 들어가기만 하고 네비게이션 해제 이벤트(`tryReleaseQueue`)가 불리지 않아서 실행(`Executing Task`)되지 않았구나. `useRootAppSetup`의 `shouldShowSplash` 조건이 영원히 풀리지 않는 상황이 발생했는지 점검해야겠다."

### 케이스 B: 네비게이션 명령이 실패한 경우
로그가 다음과 같이 찍혀있다면:
> `[INFO] navigateToChat Attempt ...`  
> `[INFO] navigateToChat Executing Task`  
> `[ERROR] navigateToChat Failed internally`

💡 **결론 도출**: "큐 로직은 정상적으로 통과하여 화면을 그리려 했으나, 전달된 `roomId`가 잘못되었거나 React Navigation 내부 스택의 구조적인 문제(타입 오류 등)로 화면 이동이 실패했구나." 파라미터나 Navigation 상태를 점검해야 합니다.
