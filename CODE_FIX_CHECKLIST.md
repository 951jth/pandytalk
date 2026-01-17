# PandyTalk 코드 수정 체크리스트 (운영·버그·품질 기준)

이 문서는 PandyTalk React Native 채팅 앱에서  
주석이나 설명을 붙이기 이전에, 코드 레벨에서 반드시 수정해야 할 사항들을  
우선순위(P0~P2) 기준으로 정리한 문서입니다.

목표는 다음과 같습니다.

- 실제 버그 가능성 제거
- 운영 관점에서 위험한 구조 제거
- 면접에서 “왜 이렇게 고쳤는지” 설명 가능한 상태 만들기

---

## P0. 반드시 수정해야 하는 치명적 버그 / 운영 리스크

### 1. 메시지 재동기화에서 DROP TABLE 사용

관련 파일

- features/chat/hooks/useChatMessagesInfinite.ts
- features/chat/data/messageLocal.sqlite.ts

현재 상태

- 메시지 재동기화(resetChatMessages) 과정에서
  SQLite messages 테이블을 DROP TABLE로 삭제하고 있음
- 의도는 메시지 재동기화지만,
  실제 동작은 전체 메시지 스키마 삭제임

문제점

- 특정 채팅방 문제가 전체 채팅 데이터 삭제로 확산됨
- DROP → CREATE 사이 타이밍에 조회 발생 시 앱 크래시 가능
- 사용자 액션(재동기화 버튼)이 DB 마이그레이션 책임까지 떠안음
- 운영 관점에서 복구 기능이 더 큰 장애를 유발할 수 있음

중요한 맥락

- 과거 스키마 컬럼 제거로 인해 테이블이 깨졌을 가능성 때문에
  DROP TABLE을 넣은 것은 이해 가능
- 하지만 이 문제는 재동기화 버튼이 아니라
  앱 부팅/마이그레이션 단계에서 해결해야 하는 문제임

수정 원칙

- DROP TABLE은 사용자 트리거에서 절대 사용하지 않는다
- 스키마 문제는 앱 시작 시 마이그레이션 책임으로 처리한다

수정 방향

- 함수 역할을 명확히 분리한다
  - dropMessagesTable()
    → DROP TABLE messages (앱 부팅 시 최후 수단)
  - clearAllMessageRows()
    → DELETE FROM messages
  - clearMessagesByRoom(roomId)
    → DELETE FROM messages WHERE roomId = ?
- 재동기화 버튼에서는
  clearMessagesByRoom 또는 clearAllMessageRows만 호출
- dropMessagesTable은 bootstrap 단계에서만 사용

---

### 2. SQLite 메시지 조회 정렬 / 페이징 기준 불일치

관련 파일

- features/chat/data/messageLocal.sqlite.ts

#### 2-1. getChatMessagesByCreated 정렬 방향 문제

현재 상태

- 쿼리: ORDER BY createdAt DESC
- 주석/의도: 오래된 → 최신 순
- 결과에 reverse 처리 없음

문제점

- UI에서 메시지 순서가 의도와 다르게 표시될 수 있음
- 페이징/재진입 시 체감 버그로 이어질 수 있음

수정 방향

- 쿼리는 DESC 유지
- 반환 직전에 reverse 적용
- ASC + 커서 재설계는 비용 대비 효율이 낮음

---

#### 2-2. seq 기반 페이징인데 createdAt으로 정렬

현재 상태

- 커서 조건은 seq
- 정렬은 createdAt / seq 혼용

문제점

- 커서 기준과 정렬 기준이 다름
- 데이터가 조금만 어긋나도 페이징 순서 붕괴 가능

수정 방향

- 모든 경우 ORDER BY seq DESC로 통일
- UI 전달 시 필요하면 reverse 처리

---

### 3. Firestore subscribe에서 lastSeq = 0 처리 버그

관련 파일

- features/chat/data/messageRemote.firebase.ts

현재 상태

- if (lastSeq) 조건 사용

문제점

- lastSeq === 0인 경우 false 처리됨
- seq는 0도 유효한 값 → 잘못된 분기 발생

수정 방향

- if (lastSeq != null) 조건으로 변경
- 0을 포함한 모든 유효 커서 허용

---

## P1. 구조적 리스크 (면접·운영에서 공격 포인트)

### 4. Auth Gate 초기화 레이스 가능성

관련 파일

- bootstrap/useAuthGate.ts

현재 상태

- onAuthStateChanged 내부에서 fetchProfile을 await 하지 않음
- initializing 상태가 먼저 false가 되어
  프로필 로딩 전 앱 진입 가능
- effect dependency에 dispatch만 존재

문제점

- 초기 화면 깜빡임
- 권한 상태/프로필 미로딩 상태로 UI 진입 가능
- Hook 규칙 위반 질문에 취약

수정 방향

- fetchProfile을 useCallback으로 분리
- auth 상태 변경 시:
  await fetchProfile
  이후 initializing false 처리
- unmount 대비 취소 플래그 추가 고려

---

### 5. ensureChatRoom 레이스 컨디션 가능성

관련 파일

- features/chat/service/chatService.ts
- features/chat/data/chatRemote.firebase.ts

현재 상태

- 존재 여부 확인 → 없으면 setDoc(merge: true)

문제점

- 여러 디바이스에서 동시에 호출 시
  createdAt, lastMessageAt 같은 필드가 덮일 수 있음

수정 방향

- runTransaction으로 “없을 때만 생성” 보장
- 또는 idempotent create 구조 + fallback get

---

## P2. 품질 / 성능 개선 (여유 있을 때)

### 6. 디버그 플래그 상시 활성화

관련 파일

- features/chat/data/messageRemote.firebase.ts

문제점

- const debug = true 상태
- 운영 빌드에서 로그 과다 / 성능 / 리뷰 포인트 발생

수정 방향

- **DEV** 기반 조건 처리
- 공통 logger 유틸로 이동

---

### 7. SQLite 대량 insert 성능 문제 가능성

관련 파일

- features/chat/data/messageLocal.sqlite.ts

현재 상태

- messages.forEach(tx.executeSql) 방식

문제점

- 메시지 수 증가 시 프레임 드랍 가능
- 에러 발생 시 reject 중복 호출 위험

개선 방향

- batch insert 또는 chunk 단위 처리
- reject 1회만 호출되도록 가드

---

## 최우선 수정 요약 (반드시 먼저)

1. 재동기화에서 DROP TABLE 제거 (데이터 삭제와 스키마 삭제 분리)
2. SQLite 메시지 조회 정렬 / seq 페이징 기준 통일
3. Firestore subscribe lastSeq 조건 수정 ( != null )

---

## 결론

- DROP TABLE 자체가 문제는 아니다
- 문제는 사용자 액션 = 스키마 삭제 구조다
- 스키마 문제는 bootstrap/마이그레이션 책임이다
- 재동기화는 데이터 레벨 복구만 담당해야 한다

이 문서에 정리된 항목들을 반영하면  
PandyTalk는 단순한 사이드 프로젝트가 아니라  
운영 전제를 이해한 채팅 앱 구조로 평가받을 수 있다.
