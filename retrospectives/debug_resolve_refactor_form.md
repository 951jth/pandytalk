# 🚀 [Refactoring Log] React Native 폼 시스템: 선언형 데이터 기반 폼 엔진으로의 전환

> **Project:** PandyTalk  
> **Topic:** 반복적인 JSX 폼 마크업을 제거하고, 유지보수성과 확장성을 극대화한 'Headless Form' 구조 도입  
> **Tech Stack:** React Hook Form (Concept), TypeScript, Compound Component Pattern

## 1. 배경 및 문제 상황 (Background & Problem)

초기 관리자 페이지(Admin) 개발 당시, 수십 개의 데이터 입력 폼(회원가입, 상품등록, 정산관리 등)을 **하드코딩된 JSX 나열 방식**으로 구현함.

### 💀 Legacy Code의 문제점

1.  **반복되는 Boilerplate:** `Label`, `Input`, `ErrorText` 컴포넌트 조합이 페이지마다 수십 번씩 복붙(Copy & Paste)됨.
2.  **일관성 붕괴:** 개발자마다 미세하게 다른 스타일(margin, padding)을 적용하여 UI 통일성이 깨짐.
3.  **유지보수 비용 폭증:** "모든 인풋의 폰트 사이즈를 바꿔주세요"라는 요구사항이 오면 100개 파일을 열어 수정해야 했음.

---

## 2. 해결 과정 (Problem Solving Process)

### 이슈 1: 선언형(Declarative) 폼 아키텍처 도입

**A. 접근 방식 (Imperative vs Declarative)**
기존의 **'어떻게 그릴지(How)'** 나열하는 명령형 방식에서, **'무엇을 그릴지(What)'** 정의하는 선언형 방식으로 패러다임 전환.

**B. 해결책: Data-Driven Form Engine**
폼의 스키마(Schema)를 배열 객체로 정의하면, 엔진이 UI를 자동으로 렌더링하도록 설계.

```typescript
// Before: JSX Hell
<View>
  <Text>이름</Text>
  <TextInput value={name} onChange={...} />
  {error && <Text>{error}</Text>}
</View>

// After: Config based
const items = [
  { key: 'name', label: '이름', required: true, type: 'text' },
  { key: 'role', label: '권한', type: 'select', options: [...] }
];
<InputForm items={items} />
```

### 이슈 2: Headless Hook을 통한 로직 분리

**A. 문제점**
폼 엔진 컴포넌트(`InputForm`) 내부에 상태 관리 로직이 강하게 결합되어, 다른 UI(모달, 바텀시트)에서 재사용하기 어려움.

**B. 해결책: `useInputForm` Hook 분리**
UI(View)와 로직(Model/Controller)을 완전히 분리.

- `useInputForm`: 값 관리, 실시간 유효성 검사, 에러 상태 관리 등 **'기능'**만 담당.
- `InputForm`: 주입받은 상태를 화면에 그리는 **'표현'**만 담당.

---

## 3. 성과 및 회고 (Results & Retrospective)

- **생산성 향상:** 신규 폼 페이지 생성 시간이 **평균 4시간 → 30분**으로 약 800% 단축됨.
- **코드량 감소:** 중복 UI 코드가 제거되어 전체 소스 코드 양이 획기적으로 줄어듦.
- **유지보수 용이:** `InputForm` 파일 하나만 수정하면 프로젝트 내 50여 개 페이지의 디자인이 일괄 변경됨.
- **회고:** "반복되는 코드를 보고 불편함을 느끼는 것"이 엔지니어링의 시작임을 깨달음. 초기 설계 비용이 들더라도, 장기적인 생산성을 위해 시스템화(Systematization)하는 것이 중요하다는 것을 체감함.
