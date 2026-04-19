---
description: EAS Update (CodePush) 사용 방법
---

// turbo-all
사용자가 "/eas-update", "업데이트해줘", "배포해줘" 또는 이와 유사한 요청을 하면 다음 단계를 수행하세요.

### 자동화 규칙:

1.  **상태 점검:** 프로젝트 루트(`c:\Users\CSH\Projects\pandytalk`)에서 변경 내역(`git status -s`)을 확인합니다.
2.  **네이티브 변경 감지:** 다음과 같은 항목이 변경 목록에 포함되어 있는지 분석합니다.
    - `package.json`의 `dependencies` 추가/삭제 (라이브러리 추가 시 네이티브 링크가 필요할 수 있음)
    - `android/` 또는 `ios/` 폴더 내의 모든 파일
    - `app.config.js` 내의 네이티브 관련 필드 (`runtimeVersion`, `versionCode`, `ios`, `android` 등)
3.  **안전성 판단:**
    - **네이티브 변경이 감지된 경우:** 즉시 작업을 중단하고, "네이티브 관련 변경 사항이 감지되어 EAS Update만으로는 위험합니다. 새로운 빌드(Build) 작업이 필요합니다."라고 사용자에게 알리고 가이드를 제공합니다. 절대 `eas update`를 실행하지 마세요.
    - **JS/Asset만 변경된 경우:** 변경 내역에 따라 적절한 커밋 메시지를 생성하고, 다음 명령어를 실행합니다.
      `npm run update -- --message "생성된 업데이트 메시지"`
4.  **결과 보고:** 작업 결과(성공 또는 중단 사유)를 요약하여 사용자에게 보고합니다.

---

이 프로젝트는 EAS Update가 설정되어 있습니다. JS 코드나 애셋(이미지 등)만 수정했을 때, 스토어 심사 없이 즉시 앱을 업데이트할 수 있습니다.

### 1. 업데이트 배포 (JS 수정 시)

수정한 코드를 사용자 기기에 즉시 반영하려면 아래 명령어를 실행하세요. 이제 `prebuild`가 자동으로 먼저 실행되어 `app.config.js` 설정이 네이티브 폴더와 동기화됩니다.

```bash
npm run update
```

또는 상세 설명과 함께 배포하려면:

```bash
eas update --branch production --message "업데이트 내용 입력"
```

### 2. 네이티브 변경 사항 반영 (중요)

아래와 같은 변경이 있을 때는 `eas update` 만으로는 부족하며, **반드시 새로 빌드해서 스토어에 업로드(또는 기기에 재설치)** 해야 합니다.

- `package.json`의 새로운 라이브러리 추가
- `android` 또는 `ios` 폴더 내의 네이티브 코드 수정
- `app.config.js`의 네이티브 설정 변경

⚠️ **주의**: 버전을 올리거나 빌드를 새로 해야 할 경우, `/release` 명령어를 사용하여 `release-versioning.md` 워크플로우에 따라 `app.config.js`, `build.gradle`, `strings.xml` 세 곳의 버전을 반드시 동기화해야 합니다. **네이티브 빌드 전에는 반드시 `npm run prebuild`를 실행하여 설정이 반영되었는지 확인하세요.**

### 3. 현재 설정 정보

- **Project ID**: `713adbab-1d3b-4992-9aab-396e9557bd0f`
- **Owner**: `sehooncho`
- **Channel**: `main` (기본값)
