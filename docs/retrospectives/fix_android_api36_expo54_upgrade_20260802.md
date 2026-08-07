# 🚀 fix: Android API 36 및 Expo SDK 54 전환 안정화 (2026-08-02)

## 📌 개요

팬디톡 Android 프로젝트를 Expo SDK 54와 Android API 36 기준으로 올리는 과정에서 Gradle 빌드, 개발용 Metro 연결, Native 설정의 소유권, 저장소 권한, 스플래시 크기, AAB 배포 명령이 서로 영향을 주는 문제가 발생했습니다.

이 프로젝트는 Expo가 처음부터 생성한 Managed 프로젝트가 아니라 **React Native CLI로 시작한 뒤 Expo Modules를 연결한 Bare 프로젝트**입니다. 따라서 `app.config.js`만 수정하고 `expo prebuild --clean`으로 Native 프로젝트를 재생성하는 일반적인 Expo 흐름을 그대로 적용할 수 없습니다. 기존 flavor, Firebase, Crashlytics, 서명, EAS Update 설정을 유지하면서 SDK 54에 필요한 Native 변경만 선별적으로 반영해야 했습니다.

이번 작업의 핵심 목적은 다음과 같습니다.

- Android API 36과 Expo SDK 54가 요구하는 Gradle·React Native Native 구성을 정렬합니다.
- `android/`와 `ios/`를 Native 설정의 원본으로 유지합니다.
- 개발 빌드, Metro 실행, AAB 생성, 제출 명령의 책임을 명확하게 구분합니다.
- SDK 전환 과정에서 발견된 권한 및 스플래시 회귀를 수정합니다.
- 변경을 기능별 커밋으로 나누어 독립적으로 롤백할 수 있게 합니다.

## 🔍 발생 현상

### 1. Gradle 빌드 실패와 경고 혼재

빌드 마지막에 Gradle 9.0 비호환 경고가 출력되어 해당 경고가 직접적인 실패 원인처럼 보였지만, `Deprecated Gradle features were used`는 실패 결과에 함께 출력된 경고였습니다. 실제 문제를 확인하려면 전체 로그에서 첫 번째 `What went wrong`과 실패한 task를 찾아야 했습니다.

동시에 Expo SDK 54와 React Native 버전에 비해 Gradle Wrapper, Android Gradle Plugin 구성, `compileSdk`, `targetSdk`, Expo autolinking 설정이 이전 구조와 혼재해 있었습니다.

### 2. Expo 개발 빌드와 Metro 진입점 불일치

개발 실행 명령을 Expo Dev Client 방식으로 바꾸면서 JavaScript 진입점이 기존 `index` 중심 흐름에서 Expo의 `.expo/.virtual-metro-entry` 흐름으로 바뀌었습니다. Native 앱만 실행하거나 Metro가 준비되지 않은 상태에서 앱을 열면 다음 문제가 발생할 수 있었습니다.

- `Unable to load script`
- `localhost:8081` 연결 실패
- USB 실기기에서 PC의 Metro 서버를 찾지 못함
- Metro 캐시와 설치된 패키지 조합이 맞지 않을 때 번들 요청이 HTTP 500으로 실패

또한 PowerShell용 Windows 경로와 명령을 Git Bash에 그대로 입력하면 역슬래시가 escape 문자로 해석되어 `C:Users...` 형태로 변형되고, `gradlew.bat`도 찾지 못하는 문제가 있었습니다.

### 3. Native 설정의 소유권이 불명확함

초기에는 `app.config.js`의 config plugin이 `build.gradle`과 `AndroidManifest.xml`을 문자열 치환 방식으로 수정하도록 구성되어 있었습니다. 하지만 실제 빌드는 저장소에 커밋된 `android/`를 사용하고 있었기 때문에 다음 두 설정 원본이 동시에 존재했습니다.

- Expo config plugin이 prebuild 시 생성하려는 설정
- 저장소의 `android/`에 직접 관리되는 flavor, package, 권한, Firebase 설정

이 상태에서 `expo prebuild --clean`을 실행하면 기존 React Native CLI Native 설정이 대량으로 재생성되거나 덮어써질 위험이 있었습니다.

### 4. Android 저장소 권한 범위 오류

기존 권한 유틸은 Android 13 미만이면 모두 `WRITE_EXTERNAL_STORAGE` 권한을 요청했습니다. 하지만 Android 10(API 29)부터는 scoped storage와 MediaStore가 기본이므로 해당 권한 요청이 필요하지 않습니다. 최신 Android에서 더 이상 유효하지 않은 권한을 요청해 저장 흐름이 불필요하게 차단될 가능성이 있었습니다.

### 5. 팬디 스플래시 로고 축소

SDK 54 기준 BootSplash 리소스는 288dp 정사각형 캔버스를 사용했지만, 생성된 팬디 캐릭터의 실제 알파 영역은 약 `76dp × 107dp`에 불과했습니다. 기존 세로형 `pandy_splash.png`와 비교하면 투명 여백이 커져 실기기에서 팬디가 작게 보였습니다.

이는 이미지 원본 자체가 작아진 것이 아니라 **동일한 캔버스 안에서 보이는 캐릭터 영역이 작게 생성된 것**이 원인이었습니다.

### 6. 빌드·제출·버전 증가 책임 혼재

기존 `build:aab` 명령은 먼저 `expo prebuild`를 실행했습니다. Bare 프로젝트에서는 불필요한 Native 재생성을 유발할 수 있었고, AAB를 다시 빌드하거나 제출할 때 Android `versionCode`, Expo `runtimeVersion`, Native 문자열 리소스가 서로 달라질 가능성이 있었습니다.

EAS 프로필에서도 APK와 AAB 목적이 명확하게 구분되지 않았고, 빌드 실패 후 같은 버전으로 재시도하는 별도 명령도 없었습니다.

## 🧭 원인 분석

### 직접 원인

1. Expo SDK와 React Native를 업그레이드했지만 Native 템플릿과 Gradle 설정은 이전 구조가 일부 남아 있었습니다.
2. React Native CLI 기원 Bare 프로젝트에 Managed 프로젝트의 prebuild 운용 방식을 혼합했습니다.
3. Expo Dev Client 명령과 기존 React Native Metro 명령의 역할이 구분되지 않았습니다.
4. BootSplash 생성 리소스의 캔버스 크기만 확인하고 실제 알파 영역 크기를 확인하지 않았습니다.
5. Android 버전 정보가 `app.config.js`, `build.gradle`, `strings.xml`에 분산되어 있었습니다.

### 구조적 원인

- `app.config.js`와 `android/` 중 어느 쪽이 Native 설정의 원본인지 문서화되어 있지 않았습니다.
- SDK 업그레이드, 개발 실행, 릴리즈 자동화가 한 번에 변경되어 문제 발생 지점을 좁히기 어려웠습니다.
- Gradle의 마지막 경고만으로 실패 원인을 판단하기 쉬웠고, 최초 실패 task를 추출하는 진단 절차가 정리되어 있지 않았습니다.
- 이미지 파일의 전체 해상도와 실제 보이는 영역을 동일하게 취급했습니다.

## ✅ 해결 원칙

### 1. Bare 프로젝트의 Native 원본 고정

다음 원칙을 `app.config.js`와 EAS 운영 가이드에 명시했습니다.

> 팬디톡은 React Native CLI로 시작해 Expo Modules를 연결한 Bare 프로젝트이며, `android/`와 `ios/`가 Native 설정의 원본이다.

- 일반 개발 및 배포 과정에서 `expo prebuild`를 실행하지 않습니다.
- package, flavor, 서명, Firebase, 권한, Native 테마는 `android/`에서 관리합니다.
- `app.config.js`는 Expo/EAS가 사용하는 메타데이터와 OTA 설정을 관리합니다.
- SDK 54의 Native 템플릿은 참고 기준으로 사용하되, 필요한 부분을 검토 후 직접 병합합니다.

### 2. Expo가 자동 변경한 범위와 직접 반영한 범위 구분

이번 저장소 변경은 일반적인 `expo run:android`가 자동으로 추적 파일을 수정한 결과가 아닙니다. SDK 54 호환성을 확인하기 위해 별도 기준 Native 구성을 참고한 뒤, 다음 내용을 직접 선별·병합했습니다.

- Expo/RN Gradle plugin 및 autolinking 설정
- Expo CLI 번들 진입점과 Hermes/Codegen 경로
- `MainApplication`과 `MainActivity` 초기화 흐름
- BootSplash 테마 및 Android 12 이상 호환 리소스
- flavor별 applicationId와 앱 이름
- API 36 compile/target SDK 설정

반대로 기존 프로젝트 고유 설정인 production/development flavor, Firebase, Crashlytics, 릴리즈 서명, EAS Update URL과 채널은 유지했습니다.

### 3. 개발 실행 명령 분리

개발 환경은 다음과 같이 역할을 분리했습니다.

```bash
# Metro를 실행하고 Expo Dev Client 개발 흐름 시작
yarn start

# developmentDebug Native 빌드·설치와 Expo Metro 연결
yarn android

# Metro가 이미 실행 중일 때 Native만 빌드·설치
yarn android:native

# USB 실기기에서 localhost:8081을 PC Metro로 전달
adb reverse tcp:8081 tcp:8081
```

Git Bash에서 Windows 경로를 사용할 때는 `C:/Users/...` 형식으로 입력하거나 프로젝트 루트에서 상대 경로를 사용합니다. PowerShell에서는 다음과 같이 실행합니다.

```powershell
Set-Location 'C:\Users\CSH\Projects\pandytalk\android'
.\gradlew.bat --stop
.\gradlew.bat clean --no-daemon
```

### 4. Android API 36 및 SDK 54 Native 정렬

- Gradle Wrapper를 `8.14.3`으로 갱신했습니다.
- `compileSdkVersion`, `targetSdkVersion`, `buildToolsVersion`을 36 기준으로 정렬했습니다.
- Expo SDK 54 방식의 Expo/RN autolinking을 적용했습니다.
- Expo CLI의 `export:embed` 번들 명령과 virtual Metro entry를 사용하도록 구성했습니다.
- Hermes, Codegen, React Native Gradle plugin 위치를 설치된 패키지 기준으로 해석하도록 변경했습니다.
- `developmentDebug`, `productionDebug`를 debuggable variant로 명시해 개발 빌드에 JS bundle이 잘못 내장되지 않도록 했습니다.
- `MainApplication`은 SDK 54의 `loadReactNative` 초기화 흐름을 사용합니다.
- `MainActivity`는 BootSplash 초기화와 Android 버전별 뒤로가기 동작을 처리합니다.

### 5. 저장소 권한 수정

`ensureAndroidWritePermission`의 기준을 API 33에서 API 29로 변경했습니다.

```ts
if (Platform.Version >= 29) return true
```

Native 매니페스트에도 권한별 최대 SDK를 지정했습니다.

- `READ_EXTERNAL_STORAGE`: `maxSdkVersion="32"`
- `WRITE_EXTERNAL_STORAGE`: `maxSdkVersion="28"`

따라서 Android 10 이상에서는 scoped storage/MediaStore 흐름을 사용하고, Android 9 이하에서만 레거시 쓰기 권한을 요청합니다.

### 6. BootSplash 팬디 크기 복원

288dp 캔버스와 중앙 정렬은 유지하면서 실제 팬디 알파 영역만 확대했습니다.

| 항목 | 변경 전 | 변경 후 |
| --- | ---: | ---: |
| 보이는 높이 | 약 103dp | 176dp |
| 보이는 너비 | 약 73dp | 124dp |
| 캔버스 | 288dp | 288dp |
| 확대 비율 | 1.0 | 약 1.7 |

`mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi` 리소스를 같은 비율로 생성했습니다. 캐릭터를 새로 그리거나 디자인을 변경하지 않고 기존 팬디 픽셀을 사용해 투명 여백만 줄였습니다.

### 7. AAB 빌드와 제출 자동화 정리

```bash
# 버전 증가 후 production AAB 생성
yarn build:aab

# 빌드 실패 후 버전을 다시 올리지 않고 재시도
yarn build:aab:retry

# 기존 production AAB를 EAS Submit으로 제출
yarn submit:aab

# 버전 증가, AAB 생성, 제출을 순서대로 실행
yarn build:submit

# 파일을 변경하지 않고 버전 정합성만 확인
yarn version:android:check
```

`scripts/bumpAndroidBuildVersion.js`는 다음 값을 동시에 검사하고 증가시킵니다.

- `app.config.js`의 `android.versionCode`
- `app.config.js`의 Android `runtimeVersion`
- `android/app/build.gradle`의 `versionCode`
- `android/app/src/main/res/values/strings.xml`의 `expo_runtime_version`

Android 빌드 증가가 iOS OTA 호환성에 영향을 주지 않도록 플랫폼별 `runtimeVersion`도 분리했습니다.

## 📂 변경 범위

### Android 빌드 시스템

- `android/build.gradle`
- `android/settings.gradle`
- `android/gradle.properties`
- `android/gradle/wrapper/gradle-wrapper.jar`
- `android/gradle/wrapper/gradle-wrapper.properties`
- `android/gradlew`
- `android/gradlew.bat`
- `android/app/build.gradle`

### Android 애플리케이션 초기화 및 매니페스트

- `android/app/src/main/java/com/cshchatapp/MainActivity.kt`
- `android/app/src/main/java/com/cshchatapp/MainApplication.kt`
- `android/app/src/main/AndroidManifest.xml`
- `android/app/src/debug/AndroidManifest.xml`
- `android/app/src/debugOptimized/AndroidManifest.xml`
- `android/app/src/development/res/values/strings.xml` 제거

### Android 테마와 이미지 리소스

- `android/app/src/main/res/values/styles.xml`
- `android/app/src/main/res/values-v31/styles.xml` 제거
- `android/app/src/main/res/values/colors.xml`
- `android/app/src/main/res/values/strings.xml`
- `android/app/src/main/res/drawable/ic_launcher_background.xml`
- `android/app/src/main/res/drawable-*/bootsplash_logo.png`
- `android/app/src/main/res/drawable-*/splashscreen_logo.png`

### JavaScript/Expo 설정 및 권한

- `app.config.js`
- `app/shared/utils/permission.ts`
- `tsconfig.json`
- `package.json`

### 배포 자동화 및 문서

- `scripts/bumpAndroidBuildVersion.js`
- `eas.json`
- `.github/workflows/cd-update.yml`
- `docs/guides/eas_guide.md`

### 변경하지 않은 범위

- iOS Native 프로젝트
- Firebase 서비스 코드와 앱 비즈니스 로직
- 채팅 도메인 코드
- 릴리즈 keystore와 비밀 정보
- EAS Update 프로젝트 ID 및 운영 채널 `main`
- `docs/chat-domain-review.md` 삭제 변경은 이번 작업과 무관해 커밋에서 제외

## 🧪 검증 결과

이번 작업에서 수행한 검증은 다음과 같습니다.

- Android `versionCode`와 `runtimeVersion` 값 `46` 동기화 확인
- `package.json`, `eas.json` JSON 파싱 확인
- `app.config.js` Node 로딩 확인
- BootSplash 5개 밀도 PNG의 캔버스 크기와 알파 경계 확인
- `git diff --check` 통과
- 변경 파일을 기능별 커밋으로 분리하고 작업 트리 잔여 변경 확인

사용자가 실기기에서 수행해야 하는 검증은 다음과 같습니다.

1. Android 12 이상에서 시스템 스플래시 팬디 크기와 잘림 여부 확인
2. Android 11 이하에서 BootSplash 배경과 앱 첫 화면 전환 확인
3. USB 실기기에서 `adb reverse` 후 개발 Metro 연결 확인
4. 알림, 사진 선택, 사진 저장 권한 흐름 확인
5. production release AAB 생성 및 설치 후 EAS Update 수신 확인
6. Play Console 제출 전 versionCode 증가와 서명 확인

> AGENTS 작업 규칙에 따라 사용자의 명시적 빌드 요청 없이 최종 Android 빌드는 실행하지 않았습니다.

## ↩️ 롤백 단위

변경은 다음 커밋으로 분리했습니다.

| 커밋 | 범위 | 단독 롤백 효과 |
| --- | --- | --- |
| `9251408` | SDK 54/API 36 Native 기준선 | Gradle, Expo Native 초기화, 기본 리소스를 이전 구조로 복원 |
| `25890fd` | 저장소 권한 분기 | API 29 이상 권한 생략 로직을 복원 전 상태로 변경 |
| `30c12bf` | 팬디 스플래시 확대 | 팬디 로고를 SDK 54 기준선의 작은 크기로 복원 |
| `7de53b7` | 빌드·제출 자동화 | package scripts, 버전 증가, EAS 프로필과 가이드를 이전 상태로 복원 |

전체 롤백이 필요하면 의존성을 고려해 최신 커밋부터 역순으로 `git revert`합니다.

```bash
git revert 7de53b7
git revert 30c12bf
git revert 25890fd
git revert 9251408
```

## 🛠️ 기술적 의의

- **설정 소유권 명확화**: Expo config와 Native 프로젝트가 서로 덮어쓰는 구조를 제거하고 `android/`를 명확한 원본으로 정했습니다.
- **업그레이드 위험 축소**: SDK 템플릿 전체를 복사하지 않고 기존 flavor와 배포 설정을 보존하면서 필요한 Native 변경만 적용했습니다.
- **개발 흐름 안정화**: Metro 실행, Native 빌드, USB 연결의 책임을 구분해 `Unable to load script` 문제의 진단 범위를 줄였습니다.
- **플랫폼 정책 대응**: API 29 이상의 scoped storage와 API 36 빌드 기준을 반영했습니다.
- **배포 추적성 향상**: 빌드 번호와 OTA runtimeVersion을 자동으로 동기화하고, 실패 재시도와 제출 단계를 분리했습니다.
- **복구 가능성 향상**: Native 기준선, 권한, 스플래시, 배포 자동화를 독립 커밋으로 만들어 회귀 발생 시 영향 범위만 선택적으로 되돌릴 수 있습니다.

## 📚 후속 개선 사항

- 실제 Android 빌드 로그에서 Gradle deprecation 항목을 `--warning-mode all`로 분리 수집하고 Gradle 9 전환 전에 제거합니다.
- 스플래시 원본과 생성 규격을 저장소 문서에 고정해 향후 SDK 전환 시 크기 회귀를 방지합니다.
- CI에서 `yarn version:android:check`를 실행해 버전 불일치를 사전에 차단합니다.
- Android 12 이상과 이하의 스플래시 스크린샷을 기준 이미지로 남깁니다.
- Native 의존성 변경과 EAS Update 대상 변경을 CI 경로 필터에서 지속적으로 구분합니다.

---
**기록자**: Codex (AI Coding Assistant)
**상태**: 코드 반영 및 정적 검증 완료, 실기기·릴리즈 빌드 검증 대기
