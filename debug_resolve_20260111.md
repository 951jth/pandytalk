# 🚀 SQLite 메시지 테이블 마이그레이션 및 캐시 초기화 최적화 로그

> **Project:** PandyTalk (Side Project)  
> **Topic:** SQLite 스키마 마이그레이션 안정성 확보 및 로컬 캐시 제어  
> **Tech Stack:** React Native, SQLite, TypeScript

## 1. 배경 및 문제 상황 (Background & Problem)

Firebase(Firestore)를 원본 데이터로, SQLite를 로컬 캐시로 사용하는 구조에서 스키마 변경 시 다음과 같은 문제 발생.

- **스키마 관리 불일치:** `CREATE TABLE` SQL을 문자열로 수동 관리하여 컬럼 누락 혹은 중복 추가 오류(`duplicate column name`) 빈번함.
- **비동기 트랜잭션 충돌:** `db.transaction` 내에서 `async/await` 사용 시 트랜잭션이 이미 종료되어 발생하는 `InvalidStateError` 이슈.
- **초기화 로직 부재:** 테스트 혹은 오류 복구를 위해 로컬 캐시(SQLite + React Query)를 안전하게 초기화하는 기능 필요.

## 2. 해결 과정 (Problem Solving Process)

### 이슈 1: 코드 기반 단일 스키마 정의 (Single Source of Truth)

**A. 해결책**
스키마 정의를 SQL 문자열이 아닌 TypeScript 개체(`ColumnDef`)로 통합하여 코드 기반으로 관리.

**B. 효과**
- 마이그레이션, 테이블 생성, INSERT 쿼리가 하나의 정의를 공유하여 정합성 확보.
- 컬럼 추가 시 한 곳만 수정하면 전체 로직에 자동 반영.

---

### 이슈 2: SQLite 트랜잭션 라이프사이클 이슈

**A. 원인 분석**
SQLite 트랜잭션 콜백은 콜백이 끝나는 즉시 커밋됨. `await`가 들어가면 다음 이벤트 루프 틱으로 넘어가므로 트랜잭션이 이미 닫힌 상태에서 쿼리를 실행하게 됨.

**B. 해결책**
비동기 작업이 필요한 경우 `sqliteCall` 래퍼 혹은 `Promise` 기반으로 트랜잭션 생명주기를 엄격히 제어하도록 리팩토링.

---

### 이슈 3: 캐시 초기화 및 운영 안정성

**A. 의사결정**
- **Reset 기능 구현:** `DROP TABLE` 및 `QueryClient.clear()`를 연동한 하이브리드 초기화 로직 구축.
- **운영 안정성:** 배포 환경에서는 함부로 실행되지 않도록 환경 변수 및 개발자 메뉴를 통해서만 접근 가능하도록 제한.

## 3. 성과 및 회고 (Results & Retrospective)

- **성과:** 마이그레이션 관련 런타임 에러 90% 이상 감소, 개발 환경에서의 데이터 초기화 생산성 향상.
- **회고:** 단순히 "작동하는 코드"보다 "변경에 유연하고 정합성이 보장되는 구조"의 중요성을 체감함. SQLite와 같은 인프라 성격의 라이브러리를 다룰 때는 그 라이브러리의 생명주기(Lifecycle)를 깊게 이해해야 함을 배움.
