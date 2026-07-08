# Chat 과제 제출 전 개선 메모

## 현재 판단

현재 `app/features/chat` 구조는 feature 단위 분리와 계층 구조가 어느 정도 잡혀 있어 과제 제출 기본선은 넘는다.

- 예상 합격 가능성: 약 70%
- 구조/설계 중심 평가: 75~85%
- 실행 기능과 기본 테스트 중심 평가: 65~75%
- 숨은 테스트, 장애 복구, 엣지케이스를 강하게 보는 평가: 50~65%

주석을 제출 전 정리했다는 전제라면 주석 자체는 감점 요인으로 보기 어렵다. 테스트도 일부만 작성했다고 바로 탈락하는 유형은 아니지만, 핵심 실패 케이스가 부족하면 숨은 테스트나 코드리뷰에서 점수가 깎일 수 있다.

## 우선 개선 항목

### 1. SQLite 저장 실패 처리 강화

대상 파일:

- `app/features/chat/data/messageLocal.sqlite.ts`

현재 `saveMessagesToSQLite`에서 개별 `executeSql` 실패를 로그만 남기고 트랜잭션을 계속 진행한다. 메시지 저장 실패가 UI와 캐시에 반영되지 않을 수 있어 데이터 정합성 리스크가 있다.

개선 방향:

- statement 실패 시 reject되도록 처리한다.
- 일부 메시지만 저장 실패했을 때 재시도 또는 상위 레이어 fallback 정책을 명확히 한다.
- 테스트에서 SQLite 저장 실패 시나리오를 추가한다.

### 2. 메시지 seq 기본값 제거 또는 정책 명확화

대상 파일:

- `app/features/chat/data/messageLocal.sqlite.ts`

현재 저장 시 `msg.seq ?? 1`을 사용한다. seq가 없는 메시지가 여러 개 저장되면 정렬, 중복, pagination 판단에 문제가 생길 수 있다.

개선 방향:

- 서버에서 확정된 메시지만 seq를 필수로 저장한다.
- optimistic 메시지는 seq 없이 별도 정렬 정책을 적용한다.
- seq가 없을 때 `1`을 넣는 대신 `null` 또는 별도 pending 정렬 기준을 사용한다.

### 3. Optimistic 메시지 머지 정책 테스트 보강

대상 파일:

- `app/features/chat/hooks/useChatMessageUpsertMutation.ts`
- `app/features/chat/service/messageService.ts`
- `app/shared/utils/chat.ts`

현재 구조는 낙관적 업데이트가 이미 적용되어 있다.

- `onMutate`에서 메시지를 `pending` 상태로 React Query 캐시와 SQLite에 먼저 반영한다.
- 서버 전송 후 `messageService.sendChatMessage`에서 로컬 SQLite 상태를 `success`로 갱신한다.
- 이후 Firestore snapshot으로 메시지가 들어오면 `addMessages`가 React Query 캐시와 SQLite를 갱신하고, `mergeMessages(existing, incoming)`에서 같은 `id` 기준으로 incoming 메시지가 기존 optimistic 메시지를 덮는다.

따라서 이 항목은 구현 누락이라기보다, 과제 리뷰에서 신뢰도를 높이기 위한 테스트/문서화 보강 항목이다.

개선 방향:

- optimistic 메시지가 먼저 보이고, snapshot 수신 후 SQLite/캐시가 중복 없이 갱신되는 흐름을 테스트한다.
- 실패 시 `failed` 상태에서 재전송/삭제 버튼이 노출되는 기존 UX가 깨지지 않도록 회귀 테스트를 추가한다.

### 4. 서버 조회 실패 상태 표현

대상 파일:

- `app/features/chat/service/messageService.ts`
- `app/features/chat/hooks/useChatMessagesInfinite.ts`

현재 서버 history fetch 실패 시 로컬 메시지를 반환하는 fallback은 좋지만, 호출부는 네트워크 실패인지 정상 로컬 조회인지 구분하기 어렵다.

개선 방향:

- fallback 발생 여부를 로그 외부로 전달할 방법을 둔다.
- 화면에서 "오프라인 데이터 표시 중" 같은 상태를 표현할 수 있게 한다.
- 재시도 버튼 또는 pull-to-refresh 동작을 명확히 연결한다.

### 5. 테스트 보강

테스트를 많이 작성하는 것보다 핵심 실패 케이스를 정확히 잡는 편이 낫다.

우선 추가하면 좋은 테스트:

- 빈 텍스트, 이미지 누락, 5000자 초과 검증
- SQLite 저장 실패 시 fallback 동작
- 서버 조회 실패 시 로컬 fallback 반환
- optimistic pending -> snapshot merge 흐름
- failed 상태에서 재전송/삭제 버튼 노출
- seq gap이 있을 때 서버 보충 조회 발생
- 중복 메시지 merge 시 id 기준 dedupe 유지

## 제출 전 확인 명령

레포 규칙상 자동 실행하지 않았지만, 제출 전에는 아래 검증을 권장한다.

```bash
yarn typecheck
yarn test
yarn lint --quiet
```

전체 검증을 한 번에 돌릴 수 있으면 아래도 가능하다.

```bash
yarn verify
```

## 정리

현재 구조는 과제 제출용으로 나쁘지 않다. 다만 시리즈 B 이상 회사의 과제라면 "구조가 있다"보다 "실패했을 때도 상태가 깨지지 않는다"를 더 중요하게 볼 가능성이 높다.

가장 효율적인 개선 순서는 다음과 같다.

1. `seq ?? 1` 제거 또는 pending 메시지 정책 분리
2. SQLite insert 실패 처리 강화
3. optimistic merge 정책 테스트 보강
4. 위 3개에 대한 테스트 추가
5. 제출 전 `typecheck`, `test`, `lint` 확인
