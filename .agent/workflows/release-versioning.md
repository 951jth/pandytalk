---
description: 프로젝트 배포 및 버전 관리 규칙 (EAS Update, Native Build 등)
---

// turbo-all
사용자가 "/release", "배포버전 올려줘", "버전업", "빌드버전 올려줘" 또는 이와 유사한 요청을 하면 다음 절차를 따르세요.

### ⚠️ 중요: 수동 버전 동기화 원칙
이 프로젝트는 Expo Bare Workflow를 사용하므로, 버전 업데이트 시 `app.config.js`만 수정해서는 안 되며 **아래의 5가지 파일(Android/iOS/JS)의 버전을 반드시 일치**시켜야 합니다.

업데이트 시 사용자가 원하는 대상(앱 버전, 런타임 버전 등)에 맞게 아래 모든 항목을 검토 및 수정하고, 수정 결과를 요약해서 사용자에게 보고하세요.

#### 1. `app.config.js` (또는 `app.json`)
- **`version`**: 앱 스토어 및 기기에 표시될 앱 외부 버전 (예: "1.3.3") - **가장 먼저 필수로 올려야 하는 표기 버전입니다.**
- `runtimeVersion`: EAS Update의 타겟팅 기준이 되는 버전 (예: "43")
  - ⚠️ **관례**: `android.versionCode`와 동일한 숫자로 유지할 것. 다르면 "어떤 빌드에 어떤 업데이트를 쐈는지" 추적이 불가능해짐.
- `android.versionCode`: 안드로이드 빌드용 정수 버전 (예: 43)
- `ios.buildNumber`: iOS 빌드용 번호 (예: "19")

#### 2. 안드로이드 빌드 설정: `android/app/build.gradle`
- `defaultConfig.versionCode`: `app.config.js`의 `android.versionCode`와 일치해야 함 (예: 43)
- `defaultConfig.versionName`: `app.config.js`의 `version`과 일치해야 함 (예: "1.4.1")
- ⚠️ **주의**: `npm run prebuild`를 실행해도 이 파일이 자동으로 갱신되지 않는 경우가 있음. **반드시 수동으로 확인하고 직접 수정**할 것.

#### 3. 안드로이드 리소스 설정: `android/app/src/main/res/values/strings.xml`
- `<string name="expo_runtime_version">`: `app.config.js`의 `runtimeVersion`과 **반드시** 일치해야 함. (예: "43")
- ⚠️ **이것이 EAS Update(코드푸쉬) 작동의 핵심**: 이 값이 다르면 앱이 EAS Update를 찾지 못해 코드푸쉬가 완전히 무시됨. AAB 빌드 전 반드시 확인.

#### 4. iOS 빌드 설정: `ios/CSHCHATAPP.xcodeproj/project.pbxproj`
- `MARKETING_VERSION`: `app.config.js`의 `version`과 일치해야 함 (예: "1.4.1")
- `CURRENT_PROJECT_VERSION`: `app.config.js`의 `ios.buildNumber`와 일치해야 함 (예: "19")
- `PRODUCT_BUNDLE_IDENTIFIER`: `app.config.js`의 `ios.bundleIdentifier`와 일치해야 함 (예: "com.cshchatapp")

#### 5. 공통 패키지 설정: `package.json`
- `"version"`: 전체 앱 버전과 동기화 (예: "1.4.1")

---

### 🚀 빌드 전 최종 점검 체크리스트 (Pre-Build Checklist)

빌드(AAB/IPA)를 뽑기 전에 아래 항목을 **모두** 확인하세요. 단 하나라도 불일치하면 코드푸쉬가 작동하지 않습니다.

#### Android 점검 항목 (6개)
- [ ] `app.config.js` `runtimeVersion` 확인
- [ ] `app.config.js` `android.versionCode` 확인
- [ ] `app.config.js` `version` 확인
- [ ] `build.gradle` `defaultConfig.versionCode` = `app.config.js`의 `versionCode` 와 일치 여부
- [ ] `build.gradle` `defaultConfig.versionName` = `app.config.js`의 `version` 과 일치 여부
- [ ] `strings.xml` `expo_runtime_version` = `app.config.js`의 `runtimeVersion` 과 일치 여부 ⭐ **(이게 달라서 코드푸쉬 안 됨)**
- [ ] `package.json` `version` = `app.config.js`의 `version` 과 일치 여부

#### iOS 점검 항목 (3개)
- [ ] `project.pbxproj` `MARKETING_VERSION` = `app.config.js`의 `version` 과 일치 여부
- [ ] `project.pbxproj` `CURRENT_PROJECT_VERSION` = `app.config.js`의 `ios.buildNumber` 와 일치 여부
- [ ] `project.pbxproj` `PRODUCT_BUNDLE_IDENTIFIER` = `com.cshchatapp` 인지 확인

#### 점검 명령어
```bash
# 체크리스트 확인 후 prebuild로 동기화 (build.gradle / strings.xml은 수동 재확인 필수)
npm run prebuild

# AAB 로컬 빌드
npm run build:aab
```

---

### 배포 시나리오별 가이드

#### 시나리오 A: JS 코드만 변경하여 OTA 업데이트를 할 때
- **액션**: 기존 `runtimeVersion`을 유지한 채 코드만 커밋하고 `npm run update` 실행. (버전업 불필요)
- **참고**: `eas-update` 워크플로우를 참조합니다.

#### 시나리오 B: 네이티브 패키지 추가 또는 대규모 릴리스로 인해 빌드를 새로 해야 할 때
- **액션**: 
  1. 아래 **5개 파일** 모두 버전 정보를 한 단계 상승 **(전부 동기화 필수!!)**:
     - `app.config.js`: `version`, `runtimeVersion` (versionCode와 동일하게), `android.versionCode`, `ios.buildNumber`
     - `android/app/build.gradle`: `versionCode`, `versionName`
     - `android/app/src/main/res/values/strings.xml`: `expo_runtime_version` ⭐
     - `ios/CSHCHATAPP.xcodeproj/project.pbxproj`: `MARKETING_VERSION`, `CURRENT_PROJECT_VERSION`
     - `package.json`: `version`
  2. **빌드 전 체크리스트** 항목 전부 수동 확인.
  3. `npm run prebuild` 실행 후 **`build.gradle`과 `strings.xml`은 반드시 수동으로 재확인**.
  4. 새로운 바이너리 빌드 → 스토어 업로드:
     ```bash
     npm run build:aab
     ```
  5. **스토어 업로드 완료 후** 새 `runtimeVersion`을 대상으로 EAS Update 배포:
     ```bash
     npm run update
     ```
