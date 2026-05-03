# 🛡️ AuthGate 로깅 및 문제 분석 가이드

AuthGate는 사용자의 인증 상태에 따라 앱 진입 여부를 결정하는 핵심 로직입니다. 튕김 현상이나 진입 불가 이슈 발생 시 다음 가이드를 따라 분석하세요.

## 1. 분석 도구
*   **Firebase Crashlytics**: 상세 타임라인(Breadcrumbs) 확인용
*   **Firebase Analytics (Realtime)**: 현재 발생 중인 이슈 패턴 확인용

## 2. 주요 이벤트 및 파라미터
### `auth_gate_decision`
앱 진입 판정이 내려질 때마다 기록됩니다.
*   `result`: `app` (진입 성공), `auth` (로그인 화면행)
*   `reason`: 판정 이유 (가장 중요)
    *   `firebase_user_null`: Firebase 인증 세션 없음
    *   `profile_loading`: 프로필 정보를 가져오는 중 (비동기 병목)
    *   `status_not_allowed`: 가입 승인 대기 또는 차단 상태 (`pending`, `reject` 등)
*   `accountStatus`: Firestore의 실제 유저 상태값

## 3. 상세 분석 프로세스 (Crashlytics 활용)
진입 이슈 발생 시 Crashlytics의 **`[DEBUG_AUTH_GATE_FAIL]`** 이슈를 클릭한 후 **[Logs]** 탭을 확인하세요.

### 정상 시나리오 (성공 로그 예시)
1. `AuthGate: onAuthStateChanged fired` (UID 존재)
2. `auth_profile_fetch_start` (DB 조회 시작)
3. `auth_profile_fetch_success` (status: confirm)
4. `auth_gate_decision` (result: app, reason: ready)

### 분석 케이스 1: 로그인 화면으로 자꾸 튕기는 경우
*   **체크**: `reason`이 `firebase_user_null`인지 확인.
*   **분석**: 만약 `onAuthStateChanged`에서 계속 `null`이 내려온다면 세션 유지 설정이나 파이버베이스 초기화 시점을 점검해야 합니다.

### 분석 케이스 2: 프로필 로딩 중에 멈추거나 튕기는 경우
*   **체크**: `reason`이 `profile_loading`인지 확인.
*   **분석**: `auth_profile_fetch_start`는 있는데 `success` 로그가 없다면, `userService.setProfile`이나 네트워크 요청에서 무한 대기 중일 가능성이 큽니다.

## 4. 디버깅 팁
새로운 판정 로직이 추가될 경우 `getAuthGateDecisionReason` 함수에 새로운 `reason` 문자열을 정의하여 트래킹 정확도를 높이세요.
