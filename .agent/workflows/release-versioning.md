---
description: 프로젝트 배포 및 버전 관리 규칙 (EAS Update, Native Build 등)
---

// turbo-all
사용자가 "/release", "배포버전 올려줘", "버전업", "빌드버전 올려줘" 또는 이와 유사한 요청을 하면 다음 절차를 따르세요.

### ⚠️ 중요: 수동 버전 동기화 원칙
이 프로젝트는 Expo Bare Workflow를 사용하므로, 버전 업데이트 시 `app.config.js`만 수정해서는 안 되며 **아래의 5가지 파일(Android/iOS/JS)의 버전을 반드시 일치**시켜야 합니다.

업데이트 시 사용자가 원하는 대상(앱 버전, 런타임 버전 등)에 맞게 아래 모든 항목을 검토 및 수정하고, 수정 결과를 요약해서 사용자에게 보고하세요.

#### 1. `app.config.js` (또는 `app.json`)
- `expo.version`: 앱 스토어에 표시될 앱 버전 (예: "1.3.3")
- `expo.runtimeVersion`: EAS Update의 타겟팅 기준이 되는 버전 (예: "34")
- `expo.android.versionCode`: 안드로이드 빌드용 정수 버전 (예: 34)
- `expo.ios.buildNumber`: iOS 빌드용 번호 (예: "9")

#### 2. 안드로이드 빌드 설정: `android/app/build.gradle`
- `defaultConfig.versionCode`: `app.config.js`의 `versionCode`와 일치해야 함 (예: 34)
- `defaultConfig.versionName`: `app.config.js`의 `version`과 일치해야 함 (예: "1.3.3")

#### 3. 안드로이드 리소스 설정: `android/app/src/main/res/values/strings.xml`
- `<string name="expo_runtime_version">`: `app.config.js`의 `runtimeVersion`과 **반드시** 일치해야 함. (예: "35") 
- *주의: 이것이 다르면 네이티브 앱이 현재 EAS Update 파티션을 찾지 못해 OTA 업데이트가 실패합니다.*

#### 4. iOS 빌드 설정: `ios/CSHCHATAPP.xcodeproj/project.pbxproj`
- `MARKETING_VERSION`: `app.config.js`의 `version`과 일치해야 함 (예: "1.3.4")
- `CURRENT_PROJECT_VERSION`: `app.config.js`의 `ios.buildNumber`와 일치해야 함 (예: "10")
- `PRODUCT_BUNDLE_IDENTIFIER`: `app.config.js`의 `ios.bundleIdentifier`와 일치해야 함 (예: "com.cshchatapp")

#### 5. 공통 패키지 설정: `package.json`
- `"version"`: 전체 앱 버전과 동기화 (예: "1.3.4")

---

### 배포 시나리오별 가이드

#### 시나리오 A: JS 코드 포션만 변경하여 OTA 업데이트를 할 때
- **액션**: 기존 `runtimeVersion`을 유지한 채 코드만 커밋하고 `npm run update` 실행. (별도 버전업 불필요)
- **참고**: `eas-update` 워크플로우를 참조합니다.

#### 시나리오 B: 네이티브 패키지 추가 또는 대규모 릴리스로 인해 빌드를 새로 해야 할 때
- **액션**: 
  1. `app.config.js`, `build.gradle`, `strings.xml`의 버전 정보(`versionCode`, `runtimeVersion` 등)를 한 단계 상승시킴. **(3개 파일 동기화 필수!!)**
  2. **`npm run prebuild` 실행**: `app.config.js`의 변경 사항을 네이티브 폴더로 동기화합니다.
  3. 새로운 바이너리로 안드로이드/iOS를 빌드 (`eas build` 또는 로컬 빌드).
  4. 이후 변경된 `runtimeVersion`을 대상으로 다음 릴리스부터 EAS Update 진행 가능.
