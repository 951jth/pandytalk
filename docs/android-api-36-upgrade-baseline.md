# Android API 36 업그레이드 기준선

## 목적

Expo SDK 53에서 54로 업그레이드하기 전 Bare Workflow 네이티브 설정과 단계별 변경을 기록한다.
SDK 업그레이드 및 `expo prebuild` 이후 이 문서를 기준으로 커스텀 설정의 누락과 버전 불일치를 점검한다.

- 기록일: 2026-07-26
- 기준 커밋: `8b0f9e713cc1aadb761454b1279052e963a29a0a`
- 기록 시점 작업 트리: clean

## 현재 SDK 및 Android 빌드 도구

| 항목 | 마이그레이션 전 | 1단계 상태 또는 후속 목표 |
| --- | --- | --- |
| Expo SDK | `~53.0.0` | `~54.0.0` |
| React Native | `0.79.2` | `0.81.5` |
| React | `19.0.0` | `19.1.0` |
| Node.js | `22.15.0` | 충족, engine `>=20.19.4` |
| Android Gradle Plugin | `8.8.2` | Native 단계에서 API 36 호환 버전 적용 |
| Gradle Wrapper | `8.11` | `8.13` 적용 |
| Kotlin | `2.0.21` | Native 단계에서 RN 0.81 템플릿과 비교 |
| Build Tools | `35.0.0` | Native 단계 목표 `36.x.x` |
| compileSdk | `35` | Native 단계 목표 `36` |
| targetSdk | `35` | Native 단계 목표 `36` |
| minSdk | `24` | 특별한 사유가 없으면 유지 |
| NDK | `27.1.12297006` | Native 단계에서 RN 0.81 템플릿과 비교 |
| Hermes | 활성화 | 유지 |
| New Architecture | 비활성화 | SDK 54 업그레이드 중 유지 |

AGP 버전은 `node_modules/react-native/gradle/libs.versions.toml`에서 확인한 값이다.
이 파일은 패키지 설치 결과물이므로 직접 편집하지 않는다.

## SDK 54 의존성 정렬 결과

1단계에서 SDK 의존성을 변경하고, RN 0.81의 AGP가 요구하는 최소 버전에 맞춰 Gradle Wrapper를 `8.13`으로 변경했다.
그 외 Native 프로젝트와 `app.config.js`는 아직 변경하지 않았다.

- Expo SDK 54 권장 핵심 버전으로 React Native, React, Expo 모듈과 RN 개발 도구를 정렬했다.
- RN 0.81 요구사항에 맞춰 Node.js engine을 `>=20.19.4`로 변경했다.
- New Architecture 전환을 분리하기 위해 FlashList는 `1.8.3`, Reanimated는 `~3.19.0`으로 유지했다.
- 두 패키지는 Expo SDK 54 기본 권장 버전 검사에서 제외하도록 `expo.install.exclude`에 명시했다.
- 사용하지 않는 `metro-react-native-babel-preset`을 제거했다.
- `npx expo install --check` 결과는 `Dependencies are up to date`이다.

설치 경고로 `react-native-fast-image@8.6.3`이 React 19를 peer dependency 범위에 포함하지 않는 것이 확인되었다.
실제 동작과 대체 라이브러리 필요 여부는 호환성 검증 단계에서 확인한다.

## 현재 배포 버전 동기화 상태

| 파일 | 항목 | 현재 값 |
| --- | --- | --- |
| `app.config.js` | `version` | `1.4.4` |
| `app.config.js` | `runtimeVersion` | `46` |
| `app.config.js` | `android.versionCode` | `46` |
| `app.config.js` | `ios.buildNumber` | `22` |
| `package.json` | `version` | `1.4.4` |
| `android/app/build.gradle` | `versionCode` | `46` |
| `android/app/build.gradle` | `versionName` | `1.4.4` |
| `android/app/src/main/res/values/strings.xml` | `expo_runtime_version` | `46` |
| iOS Xcode 프로젝트 | `MARKETING_VERSION` | `1.4.4` |
| iOS Xcode 프로젝트 | `CURRENT_PROJECT_VERSION` | `22` |
| iOS Xcode 프로젝트 | `PRODUCT_BUNDLE_IDENTIFIER` | `com.cshchatapp` |

현재 버전 값은 프로젝트의 수동 버전 동기화 규칙과 일치한다.
SDK 업그레이드 단계에서는 버전을 올리지 않고, 검증 완료 후 릴리스 단계에서 함께 변경한다.

## 보존해야 할 Android Gradle 설정

### 루트 `android/build.gradle`

- `buildToolsVersion`, `minSdkVersion`, `compileSdkVersion`, `targetSdkVersion`, NDK, Kotlin을 `ext`에서 관리한다.
- Google Services 플러그인 `4.3.15`를 명시한다.
- Firebase Crashlytics Gradle 플러그인 `2.9.9`를 명시한다.
- React Native와 Expo 루트 프로젝트 플러그인을 모두 적용한다.

### 앱 `android/app/build.gradle`

- 적용 플러그인:
  - `com.android.application`
  - `org.jetbrains.kotlin.android`
  - `com.facebook.react`
  - `com.google.gms.google-services`
  - `com.google.firebase.crashlytics`
- `react-native-vector-icons/fonts.gradle`을 수동 적용한다.
- Expo entry file 및 CLI 설정과 `bundleCommand = "export:embed"`를 사용한다.
- Hermes를 활성화한다.
- namespace 및 production applicationId는 `com.cshchatapp`이다.
- flavor dimension 이름은 `default`이다.
- product flavor:
  - `production`: `com.cshchatapp`
  - `development`: `com.cshchatapp.debug`
- release signing은 `keystore.properties`에서 값을 읽는다.
- release 빌드는 현재 minify 및 shrinkResources가 비활성화되어 있다.
- Firebase BoM `33.5.1`, Analytics, Messaging 의존성을 수동 선언한다.

`google-services.json`, keystore, `keystore.properties`의 내용은 문서나 diff에 노출하지 않는다.

## 보존해야 할 Expo config plugin

`app.config.js`에는 다음 로컬 config plugin이 있다.

### `withDevelopmentAndroidPackage`

- Prebuild 결과의 development flavor applicationId를 `com.cshchatapp.debug`로 교체한다.
- SDK 54 템플릿의 `build.gradle` 출력 형식이 바뀌면 현재 정규식이 더 이상 일치하지 않을 수 있다.
- Prebuild 후 development applicationId를 반드시 직접 확인한다.

### `withAndroidMailtoQuery`

- Android Manifest의 `<queries>`에 `mailto` VIEW intent를 추가한다.
- Prebuild 후 중복 생성 여부와 누락 여부를 확인한다.

## SDK 54 마이그레이션의 `app.config.js` 변경 범위

SDK 54 의존성과 Native 템플릿만 변경하지 않고, `expo prebuild`가 재현해야 하는 설정은
`app.config.js`와 config plugin에서 선언적으로 관리한다.

최소 변경 후보는 다음과 같다.

```js
module.exports = {
  // SDK 업그레이드와 New Architecture 전환을 분리한다.
  newArchEnabled: false,

  android: {
    package: PRODUCTION_ANDROID_PACKAGE,
    versionCode: 46,
    permissions: [
      'CAMERA',
      'READ_MEDIA_IMAGES',
      'RECEIVE_BOOT_COMPLETED',
      'WAKE_LOCK',
    ],
  },

  plugins: [
    'expo-font',
    [
      'expo-build-properties',
      {
        android: {
          compileSdkVersion: 36,
          targetSdkVersion: 36,
          buildToolsVersion: '36.0.0',
        },
      },
    ],
    withDevelopmentAndroidPackage,
    withAndroidMailtoQuery,
  ],
}
```

- SDK 54가 API 36을 기본 사용하더라도 Play 정책 대응 값을 설정 파일에서 명시적으로 관리한다.
- `expo-build-properties`는 SDK 54 호환 버전을 `expo install`로 추가한다.
- Android 권한 이름과 최종 Manifest 결과는 SDK 54 config schema 및 generated Manifest로 재검증한다.
- `READ_EXTERNAL_STORAGE`와 `WRITE_EXTERNAL_STORAGE`는 API 36에서 계속 선언할 필요가 있는지 검토한다.
- 앱 버전, versionCode, runtimeVersion은 마이그레이션 검증 완료 전까지 기존 값을 유지한다.

## 보완하거나 새로 만들 config plugin

### Build variant plugin

현재 `withDevelopmentAndroidPackage`는 이미 존재하는 development 블록을 정규식으로 교체한다.
깨끗한 Expo 템플릿에는 해당 flavor가 없을 수 있으므로 `--clean` 결과에서는 아무 변경도 하지 못할 수 있다.

다음 항목을 새 템플릿에 처음부터 생성하도록 보완한다.

- `default` flavor dimension
- `production` 및 `development` product flavor
- development applicationId `com.cshchatapp.debug`
- development 앱 이름 리소스 연결
- EAS development/production Gradle task와의 정합성

SDK 54의 generated `build.gradle` 형식에 의존하는 정규식은 fixture 테스트 또는 명확한 실패 검출을 추가한다.
패턴이 일치하지 않았는데 성공한 것처럼 넘어가면 안 된다.

### Android Gradle integration plugin

다음 수동 설정을 재현하는 config plugin 후보를 검토한다.

- Google Services 및 Crashlytics Gradle 플러그인
- Firebase BoM, Analytics, Messaging
- `react-native-vector-icons` font Gradle
- release signing이 `keystore.properties`를 참조하는 구조

Firebase 및 vector-icons 라이브러리가 제공하는 공식 config plugin이나 autolinking으로 대체 가능한 부분을 먼저 확인한다.
직접 plugin을 만들 때도 의존성 또는 Gradle 라인을 중복 삽입하지 않아야 한다.

### Android Activity 및 리소스 plugin

다음 설정의 재현 방식을 검토한다.

- portrait, singleTask, adjustResize 및 configChanges
- BootSplash 초기화와 `BootTheme`
- Android 12 스플래시 테마
- 운영/개발 앱 이름
- `mailto`, `http`, `https` query
- 커스텀 폰트 및 필요한 리소스

라이브러리 plugin이 재현하는 설정과 Pandytalk 전용 설정을 구분한다.
커스텀 리소스의 원본은 `android/` 생성 결과물에만 두지 않고 config plugin이 참조할 수 있는 저장소 자산으로 관리한다.

### 비밀정보 원칙

- keystore 비밀번호, key alias 비밀번호, 서비스 계정 정보는 `app.config.js`에 넣지 않는다.
- `google-services.json`, keystore 파일 내용은 config plugin 또는 문서에 복사하지 않는다.
- signing plugin은 `keystore.properties` 또는 빌드 환경의 secret을 참조하는 구조만 생성한다.

## `prebuild --clean` 사용 원칙

`expo prebuild --clean`은 기존 Native 파일에 새 설정을 병합하지 않는다.

```text
기존 android/ios 삭제
→ SDK 템플릿으로 재생성
→ app.config.js와 config plugin 적용
```

따라서 Native 파일에만 존재하는 설정은 config plugin으로 재현되지 않으면 사라진다.
이번 SDK 54 마이그레이션에서는 메인 작업 폴더의 Native 프로젝트를 `--clean` 결과로 바로 교체하지 않는다.

권장 실행 순서는 다음과 같다.

1. SDK 54 의존성과 `app.config.js`를 변경한다.
2. 별도 임시 복사본 또는 전용 작업 브랜치에서 `prebuild --clean --no-install`을 실행한다.
3. 깨끗하게 생성된 SDK 54 Native 프로젝트와 현재 `android/ios`를 비교한다.
4. SDK 54 템플릿에 필요한 변경만 현재 Native 프로젝트에 병합한다.
5. config plugin으로 옮긴 설정이 clean 생성 결과에서도 재현되는지 검증한다.
6. 모든 필수 설정이 선언적으로 재현된 이후에만 `--clean`을 정식 워크플로우 후보로 검토한다.

즉, 이번 마이그레이션의 clean prebuild 결과는 교체본이 아니라 비교 기준이다.

## 보존해야 할 Android Manifest 설정

### 권한

- CAMERA
- INTERNET
- READ_EXTERNAL_STORAGE
- READ_MEDIA_IMAGES
- RECEIVE_BOOT_COMPLETED
- WAKE_LOCK
- WRITE_EXTERNAL_STORAGE

API 36 업그레이드 후 오래된 외부 저장소 권한이 실제로 필요한지 별도로 검토한다.

### Package visibility query

- `https`
- `http`
- `mailto`

### Application 및 Activity

- application class: `.MainApplication`
- theme: `@style/AppTheme`
- round icon 설정
- hardware acceleration 활성화
- MainActivity launch mode: `singleTask`
- keyboard mode: `adjustResize`
- activity orientation: `portrait`
- keyboard, orientation, screen size, uiMode 등의 configChanges 유지

Android 16의 대화면 orientation 정책과 edge-to-edge 강제 동작은 별도 테스트한다.

### Expo Updates

- Updates 활성화
- runtimeVersion은 Android string resource를 참조
- check on launch: `ALWAYS`
- launch wait: `0`
- update URL: 프로젝트 EAS Update URL
- request header channel: `main`

## 보존해야 할 Android Kotlin 진입점

### `MainActivity.kt`

- `RNBootSplash.init(this, R.style.BootTheme)`를 `super.onCreate(null)`보다 먼저 실행한다.
- ReactActivityDelegate를 `ReactActivityDelegateWrapper`로 감싼다.
- main component name은 `cshchatapp`이다.

### `MainApplication.kt`

- `ReactNativeHostWrapper`와 Expo lifecycle dispatcher를 사용한다.
- Hermes 및 New Architecture 플래그를 BuildConfig에서 읽는다.
- `SoLoader.init(this, OpenSourceMergedSoMapping)`을 호출한다.
- FlashList package import가 수동으로 남아 있으므로 SDK 54 autolinking 결과에서 필요 여부를 확인한다.

## 보존해야 할 Android 리소스

- 운영 앱 이름: `팬디톡`
- development 앱 이름: `팬디톡(DEV)`
- runtimeVersion string
- 커스텀 Pretendard, BMDOHYEON, Mulish 폰트
- 앱 아이콘 및 adaptive icon 리소스
- 커스텀 BootSplash 이미지와 배경색
- Android 12 이상용 `values-v31/styles.xml`

현재 기본 AppTheme에는 다음 edge-to-edge opt-out이 있다.

```xml
<item name="android:windowOptOutEdgeToEdgeEnforcement" tools:targetApi="35">true</item>
```

API 36에서는 opt-out을 사용할 수 없으므로 SDK 54 전환 후 제거 여부와 화면 inset 처리를 검토한다.
`android/gradle.properties`의 `expo.edgeToEdgeEnabled=false`도 API 36에서는 기존 동작을 보장하지 않는다.

## 보존해야 할 iOS 설정

- `AppDelegate`는 `ExpoAppDelegate`, `ExpoReactNativeFactory`, `RCTAppDependencyProvider`를 사용한다.
- debug bundle root는 `.expo/.virtual-metro-entry`이다.
- production bundle은 `main.jsbundle`이다.
- 표시 이름은 `팬디톡`이다.
- 카메라, 사진 선택, 사진 저장 권한 문구가 있다.
- Pretendard 및 BMDOHYEON 폰트를 `UIAppFonts`에 등록한다.
- `LaunchScreen.storyboard`를 사용한다.
- Podfile은 Expo autolinking과 React Native pods를 함께 사용한다.

SDK 54는 iOS 네이티브 템플릿도 변경하므로 Android만 수정하더라도 Prebuild 결과에서 iOS 파일의 의도치 않은 변경을 확인한다.

## Prebuild 이후 필수 비교 체크리스트

- [ ] compileSdk 및 targetSdk가 36이다.
- [ ] AGP와 Gradle Wrapper가 API 36 호환 조합이다.
- [ ] `app.config.js`에 `newArchEnabled: false`가 명시되어 있다.
- [ ] `expo-build-properties`에서 API 36 설정이 명시되고 generated Gradle에 반영된다.
- [ ] `android.permissions`와 generated Manifest 권한이 의도대로 일치한다.
- [ ] development/production flavor가 모두 유지된다.
- [ ] development applicationId가 `com.cshchatapp.debug`이다.
- [ ] production applicationId가 `com.cshchatapp`이다.
- [ ] release signing 설정이 유지된다.
- [ ] Google Services와 Crashlytics 플러그인이 유지된다.
- [ ] Firebase BoM 및 Messaging/Analytics 의존성이 유지된다.
- [ ] `mailto`, `http`, `https` query가 유지되고 중복되지 않는다.
- [ ] Expo Updates URL, runtimeVersion, channel header가 유지된다.
- [ ] BootSplash 초기화 순서와 커스텀 테마가 유지된다.
- [ ] 앱 이름과 development 앱 이름이 유지된다.
- [ ] 커스텀 폰트와 아이콘 리소스가 유지된다.
- [ ] portrait, singleTask, adjustResize 설정이 의도대로 유지된다.
- [ ] Hermes는 활성화되고 New Architecture는 비활성화 상태다.
- [ ] Android 16 edge-to-edge에 맞지 않는 opt-out 설정을 정리한다.
- [ ] clean prebuild 비교본에서 config plugin 적용 실패가 감지되지 않고 넘어가는 구간이 없다.
- [ ] 비밀값이 `app.config.js`, config plugin, 문서 또는 Git diff에 포함되지 않는다.
- [ ] iOS AppDelegate, Podfile, 권한 문구, 폰트 설정에 의도치 않은 변경이 없다.
- [ ] 앱 버전과 runtimeVersion은 SDK 검증 완료 전까지 기존 값을 유지한다.

## 1단계 완료 조건

- 현재 네이티브 기준선이 이 문서에 기록되어 있다.
- SDK, API, AGP, Gradle, Kotlin, NDK 및 버전 값이 확인되었다.
- Prebuild에서 보존해야 할 커스텀 Android/iOS 설정이 식별되었다.
- `app.config.js` 및 config plugin으로 옮길 설정 범위가 식별되었다.
- clean prebuild를 비교본으로만 사용하는 마이그레이션 원칙이 기록되었다.
- 비밀 파일의 내용은 기록하지 않았다.
- SDK 54/RN 0.81 핵심 의존성이 정렬되었다.
- 네이티브 설정, `app.config.js` 및 배포 버전은 아직 변경하지 않았다.
