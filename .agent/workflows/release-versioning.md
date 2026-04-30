---
description: 프로젝트 배포 및 버전 관리 규칙 (EAS Update, Native Build 등)
---

// turbo-all
사용자가 "/release", "배포버전 올려줘", "버전업", "빌드버전 올려줘" 또는 이와 유사한 요청을 하면 다음 절차를 따르세요.

### ⚠️ 중요: 수동 버전 동기화 원칙
이 프로젝트는 Expo Bare Workflow를 사용하므로, 버전 업데이트 시 `app.config.js`만 수정해서는 안 되며 **아래의 5가지 파일(Android/iOS/JS)의 버전을 반드시 일치**시켜야 합니다.
versionCode, runtimeVersion 등 절대 빼먹지 말고 올릴 것, 그리고 app.config.js도 아래 항목에 맞춰서 꼼꼼하게 검수해

업데이트 시 사용자가 원하는 대상(앱 버전, 런타임 버전 등)에 맞게 아래 모든 항목을 검토 및 수정하고, 수정 결과를 요약해서 사용자에게 보고하세요.

#### 1. `app.config.js` (또는 `app.json`)
- **`version`**: 앱 스토어 및 기기에 표시될 앱 외부 버전 (예: "1.3.3") - **가장 먼저 필수로 올려야 하는 표기 버전입니다.**
- `runtimeVersion`: EAS Update의 타겟팅 기준이 되는 버전 (예: "34")
- `android.versionCode`: 안드로이드 빌드용 정수 버전 (예: 34)
- `ios.buildNumber`: iOS 빌드용 번호 (예: "9")

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

### ⚠️ 자주 발생하는 실수 (Common Mistakes)

#### 1. `runtimeVersion`과 `versionCode` 불일치
- **실수**: `runtimeVersion`만 올리고 `android.versionCode`를 그대로 두어 제출 시 중복 버전 에러 발생.
- **해결**: `app.config.js`에서 두 값을 항상 동일하게 유지하세요. (예: `runtimeVersion: '44'`, `versionCode: 44`)

#### 2. `prebuild` 후 네이티브 파일 수동 확인 누락
- **실수**: `app.config.js` 수정 후 `yarn build:aab`를 실행했으나, `android/app/build.gradle`에 버전이 반영되지 않은 채 빌드됨.
- **해결**: 빌드 전 `build.gradle`과 `strings.xml`의 버전이 올바르게 반영되었는지 반드시 수동으로 확인하세요.

#### 3. iOS `buildNumber` 업데이트 누락
- **실수**: Android와 달리 iOS는 업로드할 때마다 `buildNumber`가 무조건 올라가야 합니다. 이를 누락하여 App Store Connect 업로드 실패.
- **해결**: iOS 빌드 시에도 `app.config.js`의 `ios.buildNumber`를 잊지 말고 증가시키세요.