# 🚀 debug_resolve: Android 시작 크래시 및 EAS Update 차단 문제 해결 (2026-04-17)

## 📌 개요
React Native 0.79 및 Expo 53 환경에서 릴리즈 빌드 시 발생하던 `java.lang.NoClassDefFoundError` (특히 `ReactNativeFeatureFlags` 관련) 및 `libreactnative.so` 로드 실패 문제를 분석하고 해결했습니다. 네이티브 엔진 초기화가 실패하면서 EAS Update까지 연쇄적으로 중단되었던 심각한 시스템 이슈였습니다.

## ✨ 주요 변경 사항

### 1. 프로가드(ProGuard/R8) 규칙 보강
`android/app/proguard-rules.pro` 파일에 네이티브 브릿지 및 엔진 유지에 필수적인 클래스들을 보존하는 규칙을 대거 추가했습니다.
- **React Native Core**: `com.facebook.react.**` 및 `JavaScriptExecutor`, `NativeModule` 등 JNI 연동에 필수적인 클래스들을 보존하여 `libreactnative.so` 로딩 실패를 방지했습니다.
- **Expo Compatibility**: 이번 크래시의 직접적인 원인이 된 `expo.modules.rncompatibility.**` (BridgelessArchitecture 체크 로직)를 명시적으로 보존했습니다.
- **Native Loader**: 네이티브 라이브러리를 실질적으로 로드하는 `com.facebook.soloader.**` 클래스들을 보호했습니다.

### 2. EAS Update 복구 환경 마련
네이티브 초기화 단계에서의 크래시를 해결하여, 해당 단계 이후 실행되는 `expo-updates` 모듈이 정상적으로 작동할 수 있는 기반을 마련했습니다.

## 🛠️ 기술적 의의
- **아키텍처 과도기 대응**: React Native 0.79 버전은 신규 아키텍처(New Arch)를 지향하지만, 현재 프로젝트는 구 아키텍처(Old Arch)를 유지하고 있습니다. 이 과정에서 발생하는 Expo 호환성 레이어의 네이티브 충돌을 프로가드 규칙으로 해결함으로써 시스템 안정성을 높였습니다.
- **빌드 파이프라인 정상화**: 릴리즈 빌드 시 최적화 도구(R8)가 JNI를 통해 호출되는 네이티브 클래스들을 삭제하지 않도록 보장하여, 개발-배포 주기를 정상화했습니다.

---
**기록자**: Antigravity (AI Coding Assistant)  
**상태**: 최종 반영 완료 (android/app/proguard-rules.pro)
