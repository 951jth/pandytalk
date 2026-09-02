# 팬디톡 Native 설정 소유권 결정안: Bare 유지 vs Expo CNG 통일

- 작성일: 2026-08-04
- 상태: 의사결정 및 구현 대기
- 대상 버전: Expo SDK 54 / React Native 0.81.5 / Android API 36
- 관련 회고: `docs/retrospectives/fix_android_api36_expo54_upgrade_20260802.md`

## 1. 문서 목적

팬디톡의 Android/iOS Native 설정을 앞으로 어떤 방식으로 관리할지 결정하기 위한 비교 문서다.

검토 대상은 다음 두 가지다.

1. 현재처럼 `android/`, `ios/`를 원본으로 관리하는 Bare Native 구조 유지
2. `app.config.js`, config plugin, EAS 환경 설정을 원본으로 삼고 `expo prebuild --clean`으로 Native 프로젝트를 재생성하는 Expo CNG(Continuous Native Generation) 구조로 통일

현재 구조에서 곧바로 `expo prebuild --clean`을 실행하는 것은 안전하지 않다. 기존 Native 고유 설정을 app config와 config plugin으로 옮기기 전에 실행하면 flavor, Firebase, 권한, BootSplash, 서명 및 빌드 설정 일부가 유실될 수 있다.

## 2. 현재 팬디톡 구조

팬디톡은 React Native CLI로 시작한 뒤 Expo Modules와 EAS Update를 연결한 Bare 프로젝트다.

현재 Native 설정의 원본은 다음 위치다.

- Android: `android/`
- iOS: `ios/`
- Expo/EAS 메타데이터 및 OTA 설정: `app.config.js`, `eas.json`

현재 Android에 존재하는 주요 고유 설정은 다음과 같다.

- `production`, `development` product flavor
- 운영 패키지 `com.cshchatapp`
- 개발 패키지 `com.cshchatapp.debug`
- Google Services 및 Firebase Crashlytics Gradle plugin
- Firebase Analytics 및 Messaging 의존성
- 로컬 keystore 기반 release signing
- `react-native-vector-icons/fonts.gradle`
- Android 권한별 `maxSdkVersion`
- `http`, `https`, `mailto` package queries
- BootSplash 테마, 리소스 및 `MainActivity` 초기화
- Expo Updates URL, channel header, runtime version
- `windowSoftInputMode="adjustResize"`
- API 36 compile/target SDK 및 Expo SDK 54 Native 템플릿 반영 사항

iOS에는 다음 수동 설정이 있다.

- 앱 아이콘 리소스
- Pretendard 및 BMDOHYEON 폰트 등록
- 카메라·사진 라이브러리 권한 문구
- AppDelegate 및 Expo React Native 초기화
- LaunchScreen 및 Privacy Manifest

## 3. 선택지 A: Bare Native 구조 유지

### 운영 방식

- `android/`, `ios/`를 Git에 커밋한다.
- Native 설정은 Gradle, Manifest, Xcode project, Info.plist 등에 직접 반영한다.
- `app.config.js`는 Expo/EAS 메타데이터와 OTA 설정에 한정한다.
- 일반 개발과 배포 과정에서 `expo prebuild`를 실행하지 않는다.
- Expo SDK 업그레이드 시 새 템플릿과 현재 Native 프로젝트를 비교해 필요한 변경만 수동 병합한다.

### 장점

- 현재 구조를 그대로 유지하므로 단기 마이그레이션 비용과 회귀 위험이 가장 낮다.
- Gradle product flavor, custom build type, 서명, Manifest와 Native 코드에 제한 없이 접근할 수 있다.
- 생성 도구의 지원 여부와 관계없이 원하는 Native 설정을 즉시 적용할 수 있다.
- Native 빌드 결과가 저장소에 보이므로 변경 내용을 일반 코드처럼 직접 리뷰할 수 있다.
- Android와 iOS에서 특수한 Native SDK 또는 직접 수정이 많아질수록 대응하기 쉽다.

### 단점

- Expo SDK 또는 React Native 업그레이드 때마다 Native 템플릿 차이를 수동으로 병합해야 한다.
- `app.config.js`와 실제 Native 설정 사이에 package, version, runtime version 등의 중복 값이 생긴다.
- Android/iOS 설정에 익숙하지 않으면 유지보수와 장애 분석 난도가 높다.
- 라이브러리 config plugin이 제공하는 자동 설정을 충분히 활용하지 못한다.
- 개발 환경이나 브랜치별 Native 폴더가 오래되면 설정 드리프트가 발생할 수 있다.
- CI/EAS와 로컬 Native 프로젝트가 같은 상태인지 별도로 검증해야 한다.

### Bare 유지가 적합한 조건

- product flavor를 반드시 Gradle 수준에서 유지해야 한다.
- 향후에도 Native SDK와 직접 작성한 Kotlin/Swift 코드가 지속해서 늘어난다.
- Native 프로젝트를 직접 제어할 담당자와 운영 역량이 있다.
- Expo SDK 업그레이드 빈도가 낮고 수동 병합 비용을 감당할 수 있다.
- 현재 릴리즈 안정성을 유지하는 것이 설정 단순화보다 우선이다.

## 4. 선택지 B: Expo CNG로 통일

### 운영 방식

- `app.config.js`, config plugin, EAS 환경 설정을 Native 설정의 원본으로 삼는다.
- `android/`, `ios/`는 `expo prebuild --clean`으로 생성한다.
- 완전 전환 후 `android/`, `ios/`를 `.gitignore`와 `.easignore` 대상에 포함한다.
- 라이브러리가 제공하는 config plugin을 우선 사용한다.
- 팬디톡 고유 설정만 `plugins/` 아래의 로컬 config plugin으로 관리한다.
- 개발/운영 앱 구분은 Gradle product flavor 대신 `APP_VARIANT` 기반 동적 app config로 관리한다.

### 장점

- Expo SDK와 React Native 버전에 맞는 Native 템플릿을 매번 깨끗하게 생성할 수 있다.
- 앱 이름, 패키지, 버전, 권한, 아이콘, 스플래시 등의 설정 원본을 JavaScript 설정으로 모을 수 있다.
- Android/iOS Native 폴더의 장기 누적 변경과 템플릿 드리프트를 줄일 수 있다.
- Firebase, BootSplash 등 라이브러리 제공 plugin을 통해 수동 Native 설정을 줄일 수 있다.
- Native 폴더가 없는 EAS Build에서는 Prebuild를 자동으로 실행할 수 있다.
- 설정 plugin을 테스트하면 재생성 결과의 반복 가능성을 CI에서 검증할 수 있다.

### 단점

- 초기 마이그레이션 중 현재 Native 설정을 빠짐없이 옮겨야 하므로 작업량과 회귀 위험이 크다.
- app config가 지원하지 않는 설정은 config plugin을 직접 작성하고 Expo SDK 변경에 맞춰 유지해야 한다.
- Gradle과 Xcode 파일을 문자열이나 정규식으로 수정하는 위험한 plugin은 템플릿 변경에 취약하다.
- Native 파일을 직접 수정해도 다음 `prebuild --clean`에서 사라지므로 팀 작업 규칙을 바꿔야 한다.
- 앱 variant를 바꿀 때 같은 Native 폴더를 재사용하면 이전 설정이 남을 수 있어 variant별 clean prebuild가 필요하다.
- Native 문제를 진단할 때 생성 원본과 생성 결과를 함께 이해해야 한다.

### Expo CNG가 적합한 조건

- 앞으로 Expo SDK 업그레이드를 지속하고 Expo 생태계를 중심으로 운영한다.
- product flavor를 `APP_VARIANT` 기반 패키지 분기로 단순화할 수 있다.
- Native 변경 대부분이 app config 또는 안정적인 config plugin으로 표현 가능하다.
- Native 폴더 직접 수정보다 재현 가능한 자동 생성을 우선한다.
- 마이그레이션 기간 동안 Android/iOS 실기기 및 release 빌드를 충분히 회귀 검증할 수 있다.

## 5. 핵심 트레이드오프 비교

| 비교 항목 | Bare Native 유지 | Expo CNG 통일 |
| --- | --- | --- |
| 설정 원본 | `android/`, `ios/` | `app.config.js`, config plugin |
| 초기 전환 비용 | 낮음 | 높음 |
| 현재 기능 회귀 위험 | 낮음 | 전환 중 높음 |
| SDK 업그레이드 비용 | 수동 Native 병합 | 재생성 후 plugin 검증 |
| Native 자유도 | 가장 높음 | plugin 표현 범위에 의존 |
| 설정 중복 | 발생하기 쉬움 | 줄이기 쉬움 |
| 생성 재현성 | 별도 관리 필요 | 구조적으로 확보 가능 |
| product flavor | 자연스럽게 지원 | `APP_VARIANT` 전환 권장 |
| EAS Build 자동 Prebuild | 사용하지 않음 | Native 폴더가 없으면 사용 가능 |
| Native 파일 직접 수정 | 허용 | 금지해야 함 |
| 팀 진입 난도 | Android/iOS 지식 필요 | Expo config/plugin 지식 필요 |
| 장기 Expo 중심 운영 | 유지비 증가 가능 | 유리 |
| 복잡한 독자 Native 기능 | 유리 | plugin 유지비 증가 |

## 6. 팬디톡 기준 권장안

장기적으로 Expo SDK와 EAS를 계속 사용할 계획이라면 **Expo CNG 통일을 목표로 하되, 즉시 전환하지 않고 Android부터 단계적으로 검증하는 방식**을 권장한다.

이 권장안의 전제는 다음과 같다.

1. Gradle product flavor를 제거할 수 있어야 한다.
2. 개발/운영 앱 구분을 `APP_VARIANT`로 바꿀 수 있어야 한다.
3. Firebase 설정 파일을 EAS 환경별 파일 변수로 관리할 수 있어야 한다.
4. BootSplash, 폰트, 권한, Manifest 설정을 config plugin으로 표현할 수 있어야 한다.
5. 생성된 `android/`, `ios/`를 직접 수정하지 않는 규칙에 동의해야 한다.

위 전제를 수용하기 어렵거나 가까운 시일 안에 복잡한 Native SDK 작업이 예정되어 있다면 Bare 구조 유지가 더 안전하다.

## 7. Expo CNG 전환 시 설정 매핑

| 현재 Native 설정 | 전환 대상 |
| --- | --- |
| 앱 이름, package, bundle ID | 동적 `app.config.js` |
| development/production flavor | `APP_VARIANT` + EAS profile |
| versionCode, buildNumber | app config 또는 EAS remote version 정책 |
| Google Services 파일 | 환경별 `android.googleServicesFile`, `ios.googleServicesFile` |
| Firebase Gradle 설정 | React Native Firebase config plugin |
| Crashlytics Gradle 설정 | React Native Firebase Crashlytics plugin |
| BootSplash 테마와 초기화 | `react-native-bootsplash` plugin |
| Pretendard/BMDOHYEON | `expo-font` plugin 옵션 |
| Android SDK 및 build properties | `expo-build-properties` plugin |
| 권한 및 `maxSdkVersion` | 팬디톡 전용 Android Manifest plugin |
| `http`/`https`/`mailto` queries | 팬디톡 전용 Android Manifest plugin |
| `windowSoftInputMode` | app config 또는 Manifest plugin |
| release signing | EAS Credentials 또는 별도 로컬 환경 설정 |
| Expo Updates URL/channel/runtime | app config + EAS profile |

`android.softwareKeyboardLayoutMode`는 `resize`, `pan`만 표현할 수 있다. 추후 `adjustNothing`이 필요하면 팬디톡 전용 Manifest plugin에서 설정해야 한다.

## 8. Expo CNG 전환 실행 단계

### 1단계: 기준선 고정

- 현재 `android/`, `ios/` 상태를 기준 커밋 또는 태그로 보관한다.
- package ID, version, 권한, Manifest, Gradle, Info.plist, 폰트, 아이콘 및 BootSplash 목록을 확정한다.
- Firebase, 알림, 딥링크, 업데이트, 키보드 동작에 대한 회귀 테스트 목록을 만든다.

### 2단계: app config 동적화

- `APP_VARIANT=development|production`을 도입한다.
- 앱 이름, Android package, iOS bundle ID를 환경에 따라 반환한다.
- EAS profile에 동일한 `APP_VARIANT`를 넣는다.
- 개발과 운영 Firebase 설정 파일을 각각 연결한다.

### 3단계: 공식 및 라이브러리 plugin 적용

- `expo-font`
- `expo-build-properties`
- `@react-native-firebase/app`
- `@react-native-firebase/crashlytics`
- `react-native-bootsplash`

각 plugin이 생성하는 결과와 현재 Native 설정을 비교한다.

### 4단계: 팬디톡 전용 plugin 작성

- Android 권한과 `maxSdkVersion`
- package queries
- 기본 plugin이 처리하지 않는 application/activity 속성
- 필요한 키보드 soft input mode
- 라이브러리 plugin으로 대체할 수 없는 최소 Native 설정

구조화된 `withAndroidManifest`, `withInfoPlist`, `withStringsXml` 등의 mod를 우선한다. Gradle 원문 정규식 수정과 dangerous mod는 최후의 수단으로 제한한다.

### 5단계: 별도 공간에서 재생성 검증

현재 Native 원본을 보존한 상태에서 별도 브랜치 또는 임시 작업 공간에서 플랫폼별로 실행한다.

```powershell
$env:APP_VARIANT='development'
npx expo prebuild --clean --no-install --platform android
```

Android 검증 후 iOS를 진행한다. 사용자의 명시적 요청 전에는 빌드 명령을 실행하지 않는다.

### 6단계: 기능 회귀 검증

- development/production 동시 설치
- Firebase Analytics, Auth, Firestore, Messaging, Crashlytics
- 푸시 알림 수신 및 알림 클릭 이동
- BootSplash 크기, 배경색 및 edge-to-edge
- 카메라, 앨범 선택, 이미지 저장 권한
- Android 버전별 저장소 권한
- 채팅 입력창과 키보드 동작
- 커스텀 폰트 및 Vector Icons
- EAS Update channel과 runtime version
- production release 서명 및 AAB
- iOS 권한 문구, 아이콘, LaunchScreen

### 7단계: 소유권 전환

다음 조건을 모두 충족한 뒤에만 `android/`, `ios/`를 생성물로 전환한다.

- 생성 결과에 수동 Native 수정이 없다.
- 같은 입력으로 clean prebuild를 반복해도 설정이 동일하다.
- 개발/운영 환경 기능 검증이 통과한다.
- release 빌드 및 EAS Update 검증이 통과한다.
- 롤백 기준 커밋이 존재한다.

이후 Native 폴더를 Git 및 EAS 업로드 제외 대상으로 설정하고, 문서와 스크립트에서 Bare 원칙을 CNG 원칙으로 교체한다.

## 9. Bare 유지 선택 시 후속 개선

Bare를 유지하더라도 현재 설정의 중복과 업그레이드 위험은 줄여야 한다.

- `app.config.js`와 Gradle의 version/package 정합성 검사를 CI에 추가한다.
- Native 설정 소유권 규칙을 `AGENTS.md` 및 EAS 가이드에 유지한다.
- Expo SDK 업그레이드마다 생성된 새 프로젝트와 Native diff를 기록한다.
- Firebase, BootSplash, flavor, signing 설정을 별도 Native 체크리스트로 관리한다.
- `expo prebuild`가 package script나 CI에서 실행되지 않도록 검사한다.
- Android와 iOS Native 변경을 독립 커밋으로 관리한다.

## 10. 다음 채팅에서 먼저 결정할 질문

다음 작업을 시작하기 전에 아래 질문에 답한다.

1. 앞으로 Expo SDK와 EAS를 Native 운영의 중심으로 사용할 것인가?
2. Gradle product flavor를 없애고 `APP_VARIANT`로 대체해도 되는가?
3. 개발용 iOS bundle ID도 운영 앱과 분리할 것인가?
4. Firebase 개발/운영 프로젝트와 설정 파일이 각각 준비되어 있는가?
5. release signing을 EAS Credentials 중심으로 옮길 것인가, 로컬 빌드도 계속 지원할 것인가?
6. 키보드 모드는 최종적으로 `adjustResize`, `adjustPan`, `adjustNothing` 중 무엇을 사용할 것인가?
7. Android부터 전환하고 iOS를 후속 단계로 진행해도 되는가?

## 11. 다음 채팅 시작 지침

다음 채팅에서는 이 문서와 관련 회고를 먼저 읽고 다음 순서로 진행한다.

1. Bare 유지 또는 Expo CNG 통일 결정을 확정한다.
2. CNG 선택 시 `APP_VARIANT`와 product flavor 제거 범위를 먼저 확정한다.
3. 코드 변경 전에 현재 Native 설정 매핑표를 실제 파일 기준으로 재검증한다.
4. 첫 구현 범위는 Android app config와 config plugin 골격으로 제한한다.
5. clean prebuild와 빌드는 별도 검증 단계에서 사용자 확인 후 실행한다.

## 12. 참고 자료

- Expo Continuous Native Generation: https://docs.expo.dev/workflow/continuous-native-generation/
- Expo 앱 variant 구성: https://docs.expo.dev/build-reference/variants/
- Expo config plugin: https://docs.expo.dev/config-plugins/plugins/
- Expo config mods: https://docs.expo.dev/config-plugins/mods/
- Expo SDK 54 app config: https://docs.expo.dev/versions/v54.0.0/config/app/
- React Native Firebase Expo 설정: https://rnfirebase.io/

