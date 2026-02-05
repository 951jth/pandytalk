# Debug Resolve Report (2026-02-06)

안드로이드 빌드 오류 및 앱 실행 시 등록 오류에 대한 해결 내역을 기록합니다.

## 1. 문제 상황 (Problem)

- **빌드 오류**: `Multiple projects in the build are located in the same directory`
  - `@shopify/flash-list` 등 네이티브 라이브러리가 중복 인식되어 빌드 실패.
- **런타임 오류**: `cshchatapp has not been registered`
  - 앱 빌드 후 실행 시 메인 컴포넌트 이름 불일치로 인해 흰 화면/에러 발생.

## 2. 원인 분석 (Cause)

- **Settings 중복**: `android/settings.gradle` 파일에 중복된 `includeBuild` 및 Autolinking 구문이 존재하여 Gradle 구조가 꼬임.
- **Name Mismatch**: 네이티브(`MainActivity.kt`)가 찾는 `"cshchatapp"` 이름과 JS(`index.js`)가 `app.json`에서 가져오는 이름이 불일치함 (최상위 name 속성 누락).

## 3. 해결 내역 (Solutions)

- **[settings.gradle 수동 정리]**: 중복 구문을 제거하고 Expo + React Native Autolinking 표준 설정으로 최적화.
- **[app.json 교정]**: 최상단에 `"name": "cshchatapp"` 속성을 추가하여 네이티브 규격과 일치시킴.

## 4. 검증 결과 (Verification)

- **Gradle**: `./gradlew projects` 결과 중복 없이 모든 프로젝트 정상 로드 확인.
- **Runtime**: Metro 캐시 초기화 후 실행 시 정상 구동 확인.

## 5. 실행 가이드

```powershell
adb uninstall com.cshchatapp.debug
yarn start --reset-cache
yarn android
```
