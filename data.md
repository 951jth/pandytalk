# PandyTalk – Firebase + React Native 데이터 레이어 & Pagination 설계 정리

## 1. 기본 전제 / 설계 원칙

- React Native + Firebase(Firestore) 기반 채팅 앱
- Feature Based Architecture(FBA)
- 의존성 방향:
  - screen / hook → service → remote
  - Firebase SDK는 **remote 레이어에서만 사용**
- service는 **유스케이스 / 정책 / 조합**
- remote는 **IO(Firestore 쿼리, snapshot 처리)만 담당**
- React Query(Infinite Query) + SQLite 캐시 사용

---

## 2. Remote에서 Snapshot을 그대로 반환하지 않는 이유

### 문제점

- `DocumentSnapshot`, `QueryDocumentSnapshot`을 그대로 반환하면
  - service / UI 레이어가 Firebase SDK 타입에 의존하게 됨
  - `.data()`, `.id`, `startAfter(snapshot)` 등 Firebase 개념이 위로 전파됨
- 나중에 REST API / Mock / SQLite 전환 시 교체 비용 증가

### 결론

- **remote는 plain object(DTO)로 풀어서 반환**
- 단, pagination cursor는 예외적으로 snapshot을 값으로만 전달 가능

---

## 3. Remote Pagination 반환 타입 권장안

### 권장 반환 형태

```ts
type PageResult<T> = {
  items: T[]
  nextPageParam: unknown | null
  hasNext: boolean
}
```
