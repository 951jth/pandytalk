# Firebase Functions 명령어 및 테스트 가이드

이 문서에는 Firebase Functions 개발 시 자주 사용하는 기본 명령어들과, 만들어진 서버리스 함수들을 수동으로 테스트해볼 수 있는 cURL 명령어가 정리되어 있습니다.

## 🔑 Firebase 로그인

로컬 환경에서 Firebase 프로젝트에 접근 권한이 없을 경우 사용합니다.

```bash
firebase login
```

## 🚀 배포 명령어

Cloud Functions 전체 또는 일부를 배포할 때 사용합니다.

```bash
# 전체 함수 배포
firebase deploy --only functions

# 특정 함수만 배포
firebase deploy --only functions:functionName

# 특정 폴더(트리거 등) 하위 함수들만 배포
firebase deploy --only functions:triggers/*

# 시크릿 설정
firebase functions:secrets:set OPENAI_API_SECRET
```

## 📜 로그 확인

배포된 함수의 실행 결과를 터미널에서 빠르게 확인할 때 사용합니다.

```bash
# 전체 로그 확인
firebase functions:log

# 특정 함수 로그만 확인
firebase functions:log --only "functionName"

# 최근 10개만 확인
firebase functions:log --limit 10

# 지난 1시간치 로그 확인
firebase functions:log --start "1h"
```

---

## 🧪 테스트 API (cURL)

Postman 등의 앱 없이 터미널에서 바로 `Callable Function`을 실행해볼 수 있는 cURL 명령어 모음입니다.

### 1. 더미 그룹 생성하기 (유저 포함)

```bash
curl -X POST https://asia-northeast3-csh-rn.cloudfunctions.net/setupTestDummyData \
-H "Content-Type: application/json" \
-d '{"data": {}}'
```

### 2. 푸시 메시지 병렬처리 속도 확인하기 (성능 벤치마크)

```bash
curl -X POST https://asia-northeast3-csh-rn.cloudfunctions.net/testDbPerformanceCompare \
-H "Content-Type: application/json" \
-d '{"data": {"memberCount": 100}}'
```

### 3. 더미 메시지 생성하기

특정 방에 지정한 수만큼 더미 메시지를 발생시켜 UI 부하나 푸시 속도를 테스트할 때 씁니다.

```bash
curl -X POST https://asia-northeast3-csh-rn.cloudfunctions.net/sendDummyMessages \
-H "Content-Type: application/json" \
-d '{"data": {"roomId": "mKn39zVd5MgDIse1KuPg", "count": 50}}'
```
