# PandyTalk Engineering Log

README에서 줄인 구현 조건과 측정 근거를 모았습니다. 아래 설명은 현재 코드 경로를 기준으로 하며, 과거 회고의 문구보다 실제 구현을 우선합니다.

## 메시지 조회와 동기화

경로: `ChatMessageList → useChatMessageList → useChatMessagesInfinite → messageService → messageLocal/messageRemote`. React Query는 20개 단위의 infinite query 결과를 관리합니다. Service는 SQLite에서 먼저 페이지를 읽고, 로컬 결과가 페이지 크기보다 적거나 내부 `seq` 범위 또는 cursor 시작점에 gap이 있을 때 Firestore의 해당 페이지를 조회합니다. 원격 결과는 SQLite에 upsert한 후 다시 SQLite에서 읽어 반환하며, 원격 조회 오류에서는 기존 로컬 결과를 반환합니다. 따라서 cache miss에서는 네트워크 조회가 끝날 때까지 기다릴 수 있습니다.

실시간 구독은 로컬 최대 `seq` 이후의 Firestore 변경을 받습니다. 수신 결과는 SQLite에 저장한 뒤 React Query 캐시에 ID 기준으로 병합합니다. SQLite 저장이 실패해도 현재 화면의 캐시에는 수신 결과를 전달합니다. 별도의 최신 메시지 동기화는 서버와 로컬의 마지막 `seq` 차이를 확인합니다. 차이가 100개를 넘으면 우선 최신 50개만 가져옵니다.

현재 페이지의 gap 검사는 `firstSeq - lastSeq !== localMessages.length - 1`입니다. 페이지 범위의 불연속을 감지하지만, 어느 메시지가 삭제됐는지 구별하지 못합니다. tombstone이나 빈 구간 메타데이터가 없어 큰 gap의 이전 구간과 삭제된 `seq`는 후속 설계가 필요합니다. 선택적 원격 조회와 완전한 오프라인 이력 보장은 동일하지 않습니다.

- 코드: [조회·동기화 Service](../app/features/chat/service/messageService.ts), [SQLite](../app/features/chat/data/messageLocal.sqlite.ts), [Firestore](../app/features/chat/data/messageRemote.firebase.ts), [Query Hook](../app/features/chat/hooks/useChatMessagesInfinite.ts), [구독 Hook](../app/features/chat/hooks/useSubscribeChatMessages.ts)
- 배경: [gap 감지 회고](retrospectives/fix_chat_sync_gap_detection_20260328.md), [대용량 gap 처리 회고](retrospectives/fix_chat_large_data_gap_recovery_20260216.md)

## 전송 상태와 부분 실패

React Query mutation은 전송 직후 메시지를 `pending`으로 캐시에 반영합니다. Service가 같은 상태를 SQLite에 저장하고 Firestore 트랜잭션으로 채팅방의 `lastSeq`와 메시지를 갱신합니다. 서버 응답의 `seq`는 SQLite에 `success`와 함께 기록하고 Query를 갱신합니다. 원격 전송 실패 시 SQLite의 상태가 여전히 `pending`인 경우에만 `failed`로 바꿉니다. 캐시에서도 이미 확정된 `success`를 늦은 실패 결과가 덮지 않게 합니다.

서버는 성공했지만 로컬 성공 갱신에 실패한 경우, 전송 성공을 실패로 재분류하지 않습니다. 이 경우 로컬 상태는 구독·후속 조회로 보정해야 하므로 즉시 일치한다고 주장할 수 없습니다. 재시도는 기존 메시지 ID로 Firestore 문서를 확인하고, 이미 전송된 메시지라면 기존 `seq`를 사용합니다. 이 정책은 불확실한 응답 이후의 중복 전송 가능성을 줄이지만 모든 장애에서 정확히 한 번 처리를 보장하는 설명은 아닙니다.

- 코드: [전송 Service](../app/features/chat/service/messageService.ts), [mutation](../app/features/chat/hooks/useChatMessageUpsertMutation.ts), [Firestore transaction](../app/features/chat/data/messageRemote.firebase.ts), [SQLite 상태 갱신](../app/features/chat/data/messageLocal.sqlite.ts)
- 테스트: [채팅 테스트 디렉터리](../app/features/chat/test)

## AI 스트리밍과 백업

Firestore 문서 생성 트리거는 `@팬디` 멘션을 확인하고 AI placeholder를 만든 뒤 Cloud Tasks 작업을 30초 후로 예약합니다. 앱의 SSE 요청은 Firebase ID token을 포함합니다. HTTP Function은 토큰, 채팅방 멤버 여부, 질문자 여부와 AI 메시지 상태를 확인한 후 응답 chunk를 전송하고 결과를 Firestore에 저장합니다. 클라이언트는 첫 chunk부터 텍스트를 표시하고 완료·오류·언마운트·reset에서 연결과 활성 연결 표시를 정리합니다.

백업 태스크는 실행 시 AI 메시지가 `success` 또는 `failed`면 건너뛰고, 그 외 상태에서는 전체 답변을 생성해 저장합니다. 실패하면 Cloud Tasks 재시도 설정이 적용됩니다. 이 상태 확인만으로 살아 있는 SSE 연결의 소유권을 판단하지는 못합니다. 서버 전역 lease/heartbeat나 조건부 terminal write가 없어 SSE와 백업의 경쟁 또는 중복 생성을 배제할 수 없습니다. 백업 예약 자체가 실패하면 오류 처리 경로로 들어갑니다.

- 코드: [멘션 트리거](../functions/src/triggers/chats/onAiMention.ts), [SSE Function](../functions/src/triggers/chats/onAiStream.ts), [백업 Task](../functions/src/triggers/chats/onAiStreamBackup.ts), [클라이언트 수명주기](../app/features/chat/hooks/useAiStreamResponse.ts)

## 성능 측정 원본과 해석

- [SQLite 측정 원본](../app/features/chat/perpomance.md): 개발 환경 5회에서 Firestore 원격 fetch 평균 286.74ms(최소 155.90, 최대 535.88), warm SQLite local query 평균 9.24ms(최소 7.89, 최대 10.91). `performance.now()` 기반 커스텀 측정입니다. cache miss의 fetch·save·재조회 전체 시간과 RN 화면 렌더링은 제외됩니다. 다른 경로의 지연을 비교한 것이므로 전체 화면 진입이 31배 빨라졌다는 근거로 쓰지 않습니다.
- [AI 스트리밍 측정 원본](research/ai-stream-performance-results.md): 같은 모델·프롬프트에서 tool/search preflight를 뺀 6회 비교의 non-stream 전체 완료 평균 2,511.84ms와 stream 첫 content chunk 평균 771.17ms입니다. 두 시점의 차이 1,740.67ms와 문서의 69.30%는 해당 프롬프트의 첫 노출 시점 비교이며 생성 완료 속도 비교가 아닙니다. tool/search를 포함한 별도 5회에서는 첫 화면 출력 평균 12.91초, 전체 완료 평균 23.54초, 버퍼 반영 후 첫 텍스트 표시 평균 31.40ms였습니다. 해당 기록에서 대기 대부분은 서버 첫 chunk 준비에 있었습니다.

## 테스트와 배포 근거

채팅의 Service, Local/Remote, Query·구독 Hook 테스트는 [테스트 디렉터리](../app/features/chat/test)에 있습니다. 조회 부족·gap·원격 오류, 전송 상태·재시도, 구독 저장 실패 등의 시나리오가 파일에 정의돼 있습니다. 이 문서 작업에서 Jest나 기기 검증은 수행하지 않았습니다.

FCM은 [서버 발송 유틸리티](../functions/src/utils/fcm.ts)와 클라이언트 messaging 설정을 사용합니다. EAS Update는 [앱 설정](../app.config.js), [업데이트 수신 Hook](../app/shared/hooks/useEASUpdateManager.ts), [CI 발행 워크플로](../.github/workflows/cd-update.yml)에 연결돼 있습니다. Android 앱은 [Google Play 페이지](https://play.google.com/store/apps/details?id=com.cshchatapp)에서 확인할 수 있습니다. CI 구성의 존재와 최근 실행 성공은 별개입니다.
