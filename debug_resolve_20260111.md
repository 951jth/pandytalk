# SQLite 메시지 테이블 마이그레이션 & 캐시 초기화 회고

## 1. 배경

Firebase(Firestore)를 **Source of Truth**로 사용하고,  
SQLite + React Query를 **로컬 캐시 계층**으로 사용하는 채팅 앱 구조에서 다음 요구사항이 생겼다.

- 메시지 테이블 스키마가 여러 번 변경됨
- 마이그레이션 중 컬럼 누락 / 중복 / 순서 오류가 자주 발생
- 로컬 캐시(SQLite + React Query)를 초기화하는 기능이 필요
- 해당 기능을 **배포 환경에 넣어도 되는지** 판단 필요

---

## 2. 초기에 겪은 문제들

### 2.1 스키마 정의 중복으로 인한 실수

- `CREATE TABLE V1 / V2 / V3` SQL을 문자열로 직접 관리
- 컬럼 하나 추가할 때마다 여러 파일을 동시에 수정해야 함
- 결과:
  - `imageUrl`이 있는데 INSERT에서 빠짐
  - `seq`, `status` 컬럼 중복 추가
  - `duplicate column name` 에러 발생

### 2.2 SQLite transaction + async/await 문제

- `db.transaction(async tx => { await ... })` 패턴 사용
- 결과:
  - `InvalidStateError: transaction is already finalized`
- 원인:
  - SQLite(WebSQL 계열 포함)는 **transaction 콜백 종료 시점에 커밋**
  - `await`는 다음 tick에서 실행되어 트랜잭션 생명주기와 충돌

### 2.3 버전별 컬럼 정의 불일치

- V1 테이블에는 없는 컬럼을 V1 insert에서 사용
- 마이그레이션 기준과 실제 CREATE SQL이 서로 다름
- reset 로직에서 **진짜 V1 상태를 만들지 못함**

---

## 3. 해결 전략

### 3.1 단일 소스 오브 트루스(Single Source of Truth) 도입

#### 컬럼 정의를 코드로 통합

```ts
type ColumnDef = {
  name: string
  sql: string
}
```
