# Chat 도메인 잔여 구조 및 예외 폴백 검토

- 갱신일: 2026-07-18
- 범위: `app/features/chat`, `functions/src/triggers/chats`, `functions/src/services/aiChatService.ts`
- 기준: 완료된 메시지 전송·재시도·구독 책임 분리 항목은 제거하고, 남은 작업만 기록한다.

## 1. 남은 UI 계층의 Data 직접 의존

Screen과 Component의 Remote 직접 호출은 없지만 아래 Hook과 Utils 의존은 남아 있다.

| 호출 위치 | 직접 의존 | 변경 방향 |
| --- | --- | --- |
| `hooks/useChatMessageDeleteMutation.ts` | `messageLocal.deleteMessageById` | `messageService.deleteLocalMessage` 경유 |
| `hooks/useChatMessagesInfinite.ts` | `messageLocal.clearMessagesByChatRoomId` | `messageService.clearLocalMessages` 경유 |
| `hooks/useUpdateLastReadOnBlur.ts` | `readStatusRemote.updateChatLastReadByUser` | 신규 `readStatusService.markAsRead` 경유 |
| `utils/message.ts` | `messageRemote.generateMessageId` | Service가 ID와 payload 생성을 담당 |

적용 순서는 읽음 Service 추가, 로컬 삭제·초기화 이동, ID·payload 생성 이동, ESLint `no-restricted-imports` 적용 순으로 한다.

## 2. AI Streaming 구조 및 에러 폴백

```text
@팬디 메시지
  -> onAiMention: placeholder(streaming) 생성 + 30초 백업 예약
  -> onAiStream: 클라이언트 SSE 생성
  -> onAiStreamBackup: 미완료 응답 대신 생성
  -> updateAiResponse: 메시지와 채팅방 메타데이터 저장
```

### 2-1. 공개 SSE API의 인증·권한 검증 누락 — P0

`onAiStream`은 ID Token, App Check, 채팅방 멤버십을 확인하지 않는다. 요청 body의 `chatId`, `messageId`, `prompt`, 이미지를 그대로 사용하며 `messageId`가 없어도 AI 비용이 발생할 수 있다.

- ID Token과 App Check를 검증한다.
- 요청자가 `chat.members` 및 AI 메시지의 `mentionerId`와 일치하는지 확인한다.
- `messageId`를 필수로 받고 prompt와 이미지는 Firestore 원본에서 읽는다.
- 사용자·채팅방 단위 rate limit과 입력 크기 제한을 둔다.

### 2-2. SSE와 백업 태스크가 동시에 실행됨 — P1

백업은 `success`, `failed`만 제외하므로 30초 이상 진행 중인 `streaming` 메시지에도 두 번째 AI 요청을 시작한다. 코드 주석과 실제 조건도 일치하지 않는다.

- `processingOwner`, `leaseExpiresAt`, `attempt`를 메시지에 둔다.
- SSE와 Backup 모두 트랜잭션으로 lease를 선점한 실행자만 AI를 호출한다.
- 완료·실패 저장도 owner와 상태가 일치할 때만 허용한다.

### 2-3. 백업 재시도가 첫 실패 후 무력화됨 — P1

Backup은 `maxAttempts: 3`이지만 첫 실패에서 메시지를 `failed`로 만든 뒤 throw한다. 다음 Cloud Tasks 호출은 `failed`를 보고 종료하므로 실제 AI 생성 재시도는 한 번뿐이다.

- 재시도 가능 오류는 `attempt`, `lastError`, `nextRetryAt`만 기록하고 throw한다.
- 최대 시도가 끝난 뒤에만 최종 `failed`로 바꾼다.
- 인증·입력 오류처럼 재시도 불가능한 오류만 즉시 실패 처리한다.

### 2-4. placeholder 생성·백업 예약 실패 복구 누락 — P1

`onAiMention`의 최상위 catch는 오류를 삼켜 트리거 재시도를 막는다. placeholder 생성 후 enqueue만 실패하면 클라이언트 SSE가 시작되지 않을 경우 계속 `streaming`에 남는다.

- 재시도 가능한 트리거 오류는 다시 throw한다.
- `backupScheduledAt` 등으로 예약 여부를 기록하고 enqueue를 재시도한다.
- 미예약 `streaming` 메시지 복구 작업을 둔다.
- 원본 메시지별 결정적 ID 또는 매핑으로 placeholder 중복 생성을 막는다.

### 2-5. `[DONE]`이 최종 저장보다 먼저 전달됨 — P1

`onAiStream`은 `[DONE]` 후 `finally`에서 Firestore를 저장한다. 저장 실패에도 클라이언트는 성공으로 인식하며 메시지는 `streaming`에 남을 수 있다. `handleAiError`도 내부 저장 오류를 삼켜 호출자가 성공으로 오인한다.

- Firestore 최종 저장 성공 후에만 `[DONE]`을 보낸다.
- 저장 실패 시 오류 이벤트를 보내고 백업 재처리 가능한 상태를 유지한다.
- `handleAiError`는 상태 저장 실패를 호출자에게 throw한다.
- 클라이언트는 Firestore의 `success`를 최종 완료 기준으로 삼는다.

### 2-6. 이미지 전용 멘션 정책 불일치 — P1

Mention과 Hook은 prompt 없이 이미지만 있는 요청을 허용하지만 SSE는 오류로 종료하고 Backup은 정상 return한다. placeholder가 영구 `streaming`에 남을 수 있다.

- 지원하면 서버에서 기본 prompt를 만든다.
- 지원하지 않으면 placeholder 생성 전에 거절한다.
- Mention, SSE, Backup이 하나의 입력 검증 함수를 공유한다.

### 2-7. AI 완료가 최신 채팅방 메타데이터를 덮어씀 — P1

AI 생성 중 새 사용자 메시지가 와도 `updateAiResponse`가 `room.lastMessage`와 `lastMessageAt`을 AI 메시지로 바꾼다. AI 메시지 seq가 현재 `room.lastSeq`와 같을 때만 목록 메타데이터를 갱신하고, `recentMessages`도 seq 순서를 보장해야 한다.

### 2-8. 클라이언트 종료·재시도 폴백 누락 — P1

`processedMessageIds`는 성공 시에만 ID를 제거한다. `onError`, catch, `resetStream`에서는 제거하지 않아 앱 재시작 전까지 재시도를 막을 수 있다. EventSource 종료 함수와 무응답 timeout도 없다.

- 성공·오류·취소를 공통 종료 함수로 모아 ID를 항상 정리한다.
- 상태와 시작 시각을 가진 만료 가능한 레지스트리를 사용한다.
- Remote가 `close()`를 반환하고 Hook unmount와 reset에서 호출한다.
- 연결 시작 timeout과 chunk idle timeout을 추가한다.
- 재시도는 서버 lease와 결합해 중복 생성을 막는다.

### 2-9. AI 실패 상태와 목록 미리보기 불일치 — P2

`handleAiError`는 메시지만 `failed`로 바꾼다. placeholder가 마지막 메시지라면 목록에 계속 “답변 생성 중”으로 보일 수 있다. 실패 메시지가 현재 마지막 seq일 때만 `room.lastMessage`도 실패 상태로 갱신해야 한다.

## 3. 일반 채팅의 에러 폴백 누락

### 3-1. 실시간 메시지 구독 오류 후 재연결 없음 — P1

observer 오류는 로그로만 남고 재구독이나 누락 구간 보충이 없다. Remote가 오류를 Service로 전달하고, Service가 재시도 가능 오류만 backoff로 재구독한 뒤 `syncMessages`로 누락 seq를 보충해야 한다. 권한 오류는 재시도하지 않고 UI에 전달한다.

### 3-2. 메시지 조회 오류가 빈 채팅으로 위장됨 — P1

`useChatMessagesInfinite`는 모든 오류를 빈 페이지로 바꾼다. SQLite와 서버가 모두 실패해도 성공한 빈 채팅으로 인식된다. 사용할 로컬 데이터가 없으면 오류를 Hook까지 throw해 빈 채팅과 조회 실패를 구분해야 한다.

### 3-3. 전송 실패 상태의 SQLite 저장 실패 복구 없음 — P2

원격 전송 실패 후 `markMessageAsFailedIfPending`도 실패하면 SQLite에 `pending`이 남을 수 있다. 로컬 복구 큐를 두고 앱 시작 또는 방 진입 시 오래된 pending을 서버의 동일 ID로 조회해 재조정해야 한다. pending에는 만료 판단용 `updatedAt`도 필요하다.

### 3-4. 읽음 상태가 fire-and-forget임 — P2

`useUpdateLastReadOnBlur`는 Remote Promise를 await/catch하지 않고 캐시를 즉시 무효화한다. `readStatusService`가 입력 검증과 서버 max 정책을 맡고, 성공 후 캐시를 갱신하며 일시적 실패만 제한적으로 재시도해야 한다.

### 3-5. 푸시 트리거 오류가 재시도되지 않음 — P2

`sendNewMessageNotification`은 FCM 오류를 삼켜 일시적 장애에서도 알림이 유실된다. 재시도 가능 오류는 throw하고, 영구 실패 토큰은 제거하며, 메시지 ID 기반 멱등 처리로 중복 알림을 막아야 한다.

## 4. 그 밖의 잔여 도메인 예외

- 제한 쿼리의 `removed`를 전체 캐시 삭제로 처리하면 조회 범위 밖으로 이동한 방도 사라질 수 있다. 실시간 첫 페이지와 과거 페이지를 분리해야 한다.
- DM 상대 수, 자기 자신 포함 여부, type과 실제 멤버 수를 검증하고 기존 고정 ID 방의 생성 메타데이터를 덮어쓰지 않아야 한다.
- 이미지 업로드와 신규 방 생성 전에 입력을 지우지 말고, 성공 후 초기화하며 실패 시 초안을 유지해야 한다.
- 읽음 seq는 로드된 전체 메시지가 아니라 실제 visible item을 기준으로 기록해야 한다.

## 5. 권장 구현 순서

1. **P0**: SSE 인증·App Check·멤버십·서버 원본 검증
2. **P1**: AI lease로 SSE와 Backup 중복 생성 차단
3. **P1**: Backup 재시도 모델과 최종 실패 시점 정리
4. **P1**: 저장 성공 후 `[DONE]` 전송 및 저장 실패 복구
5. **P1**: EventSource 취소·timeout·안전한 재시도
6. **P1**: 메시지 구독 재연결과 누락 seq 동기화
7. **P1~P2**: 이미지 정책, 목록 메타데이터, 조회 오류 노출 정리
8. **P2**: 남은 UI 계층의 Data 직접 의존 제거

## 6. 핵심 검증 시나리오

- SSE가 30초를 넘어도 Backup이 동시에 AI를 호출하지 않는다.
- Firestore 최종 저장 실패 시 `[DONE]`이 전달되지 않고 재처리된다.
- Backup 1·2회 실패 후 3회째 성공하면 중간에 최종 `failed`가 되지 않는다.
- 화면 이탈 시 스트림이 닫히고 재진입 시 중복 생성 없이 복구된다.
- AI 생성 중 새 메시지가 와도 목록의 최신 메시지가 역행하지 않는다.
- 구독 재연결 후 끊긴 seq 구간이 보충된다.
- SQLite와 서버 조회가 모두 실패하면 빈 채팅 대신 오류가 노출된다.
- SQLite 상태 갱신 실패 후에도 오래된 pending이 복구된다.

## 검토 참고사항

- 이번 작업은 문서 갱신과 정적 코드 점검만 수행했다. 빌드와 테스트는 실행하지 않았다.
- Firestore Rules 파일을 찾지 못해 실제 배포 권한 규칙은 검증 범위에서 제외했다.
