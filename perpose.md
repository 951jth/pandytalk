# 🚀 Ridi Manta Team App Development Roadmap

리디 만타(Manta) 팀의 프론트엔드 엔지니어 채용 공고를 바탕으로, 본 프로젝트(`pandytalk`)에서 실무 역량을 증명하기 위해 수행하기 좋은 작업들을 정리한 로드맵입니다.

---

## 🎯 핵심 목표: "기술적 미스터리를 남기지 않는 엔지니어링"

### 1. 📊 관측 가능한 프런트엔드 (Observability)

리디는 "예측 불가능한 동작은 해결해야 할 신호"로 간주합니다. 앱 내 모든 상황을 데이터로 파악할 수 있는 구조를 만듭니다.

- [ ] **Custom Logger 서비스 구현**: `shared/services/logger.ts` 제작 (Error, Info, Warn 레벨 관리)
- [ ] **Firebase 연동**: Crashlytics 및 Analytics를 통한 실시간 에러/로그 트래킹
- [ ] **성능 지표 수치화**:
  - [ ] 메시지 렌더링 지연 시간(Latency) 측정
  - [ ] FlashList FPS 및 메모리 사용량 모니터링 로직 추가
- [ ] **성과 수치화**: "오프라인 모드 도입으로 초기 렌더링 속도 0.x초 개선"과 같은 정량적 데이터 확보

### 2. 🛡️ 데이터 정합성 & 신뢰 보장 (Reliability)

채팅 앱의 핵심인 '데이터 일관성' 문제를 근본적으로 해결하는 역량을 보여줍니다.

- [ ] **테스트 코드(Unit Test) 강화**:
  - [ ] `mergeMessages` 등 핵심 유틸 로직에 대한 Edge Case 테스트 (Jest)
  - [ ] 네트워크 중단/지연 시나리오에서의 로컬-서버 동기화 검증
- [ ] **메시지 재동기화(Resync) 고도화**: 단순 복구를 넘어 재동기화 과정을 시각적으로 신뢰 있게 전달하는 UX 개선
- [ ] **데이터 정규화**: Redux/Zustand 상태 구조 최적화 및 SQLite-Firebase 간 정합성 검사 로직 추가

### 3. 🌍 글로벌 서비스 역량 (Scalability)

200개국 대상 서비스를 고려한 설계를 적용합니다.

- [ ] **i18n 도입**: 다국어 처리 구현 (`react-i18next`)
- [ ] **글로벌 대응**:
  - [ ] 날짜/시간대(UTC vs Local) 처리 로직 고도화
  - [ ] RTL(Right-to-Left) 레이아웃 대응 고려
- [ ] **접근성(Accessibility)**: Screen Reader 대응 (`accessibilityLabel` 등 활용)

### 4. 🎨 디자인 시스템 & UX 품질 (Quality)

"UI/UX 품질 향상 및 성능 최적화" 항목을 충족합니다.

- [ ] **자체 UI Library 구축**: `@app/shared/ui` 중심의 일관된 디자인 시스템 가이드 구현
- [ ] **이미지 최적화**: `react-native-fast-image` 캐싱 전략 및 스켈레톤 UI 적용
- [ ] **애니메이션 최적화**: `react-native-reanimated`를 활용한 부드러운 인터랙션

### 5. 🛠️ 인접 도메인 이해 (Full-stack Mindset)

백엔드, 인프라를 이해하는 프론트엔드 엔지니어로서의 깊이를 보여줍니다.

- [ ] **Firebase Cloud Functions**:
  - [ ] FCM 알림 트리거 로직 구현 및 전송 실패 대응
  - [ ] Firestore Security Rules를 통한 정교한 권한 제어
- [ ] **Deep Linking**: 푸시 알림 클릭 시 특정 채팅방 진입 및 상태 복구 시나리오 완성

---

## 📌 이 프로젝트를 통해 증명하고자 하는 가치

1. **데이터 기반의 문제 해결**: 감에 의존하지 않고 로그와 지표를 통해 개선점을 도출함
2. **운영 안정성**: 기술적 결함을 미연에 방지하고, 발생 시 즉시 복구 가능한 설계를 지향함
3. **사용자 중심 최적화**: 글로벌 사용자의 다양한 환경(저사양 기기, 불안정 네트워크)에서도 최상의 UX 제공
4. **기록과 공유**: 문제 해결 과정을 문서화하고 팀의 지식으로 자산화함 (Retrospectives)
