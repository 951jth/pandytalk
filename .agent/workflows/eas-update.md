---
description: EAS Update (CodePush) 사용 방법
---

이 프로젝트는 EAS Update가 설정되어 있습니다. JS 코드나 애셋(이미지 등)만 수정했을 때, 스토어 심사 없이 즉시 앱을 업데이트할 수 있습니다.

### 1. 업데이트 배포 (JS 수정 시)

수정한 코드를 사용자 기기에 즉시 반영하려면 아래 명령어를 실행하세요.

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
- `app.json`의 네이티브 설정 변경

### 3. 현재 설정 정보

- **Project ID**: `713adbab-1d3b-4992-9aab-396e9557bd0f`
- **Owner**: `sehooncho`
- **Channel**: `production` (기본값)
