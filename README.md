# 프로젝트 이름: 팬디톡

- Firebase 기반의 React Native 1:1/그룹 채팅 앱으로, 개인 프로젝트의 관리자용 커뮤니케이션 도구로 개발되었습니다.
- 기본적인 개인 간 채팅 기능을 중심으로 설계되었으며, 실제 서비스 환경에서도 활용할 수 있도록 SQLite, React Query 기반의 데이터 캐싱 및 최적화 구조를 적용했습니다.

---

## 📌 Overview

이 프로젝트는 React Native로 개발된 사이드 프로젝트로,
아래 두 가지 핵심 목표를 가지고 제작되었습니다.

- Firebase 요청 횟수를 최소화하여 비용을 최적화하고, 실무에서도 바로 활용 가능한 구조와 모듈을 구현하는 데 집중했습니다.
- 개인 사용자 간의 1:1 문의 및 그룹채팅 등의 간단한 커뮤니케이션을 위한 경량 채팅 서비스로, 개인 용도 및 사이드 프로젝트용 고객 지원 목적을 갖고 설계되었습니다.

---

## ✨ MVP & 핵심 기능

1. **사용자 로그인/유저 회원가입 신청**

- Firebase Authentication 기반 로그인 기능을 제공하며, 사용자는 약관 동의 후 최소 정보를 입력해 가입을 요청할 수 있습니다.
- 가입 신청 유저는 관리자 승인 후에만 서비스 이용이 가능하도록 하여 운영 제어와 보안성을 강화했습니다

2. **실시간 채팅**

- Firestore의 onSnapshot 기반 실시간 구독으로 1:1 및 그룹 채팅 기능을 구현했습니다.
- 메시지 변경사항을 구독하여 채팅방별 **읽지 않은 메시지(언리드 카운트)**를 자동 계산하도록 설계했습니다.
- 불필요한 리스너를 방지하고 성능을 유지하기 위해 채팅방 단위로 구독을 분리해 최적화했습니다.

3. **채팅방 리스트 & 정렬**

- 채팅방 목록 조회, 언리드 메시지 카운트, 신규 채팅방 감지를 각각 커스텀 훅으로 분리해 재사용성과 유지보수성을 강화했습니다.
- 최근 메시지를 기준으로 채팅방을 자동 정렬하여, 최신 대화가 상단에 노출되도록 구성했습니다.

4. **FCM 푸쉬 알림**

- 1:1 및 그룹 채팅의 새로운 메시지를 감지해 Firebase Cloud Messaging(FCM) 기반 푸시 알림을 발송하도록 구현했습니다.
- 알림 클릭 시 해당 채팅방으로 직접 navigate 되도록 딥링크 구조로 설계해 사용자 접근성을 높였습니다.

5. **그룹 및 유저 관리**

- 관리자 계정으로 로그인하면 유저 및 일반 사용자 관리 탭에 접근할 수 있습니다.
- 모든 유저 계정은 관리자의 승인 후에만 서비스 이용이 가능하도록 설계했습니다.
- 필요 시 관리자가 각 사용자 정보를 수정하거나 상태를 변경할 수 있는 관리 기능을 제공합니다.

---

## 🧰 Tech Stack

### **App Framework**

- **React Native (`@react-native-community/cli`)**  
  → Android 중심 환경에서 네이티브 모듈 기능을 학습하기 위해 사용하였습니다.

### **Language**

- **TypeScript**  
  → Firebase 기반 프로젝트 특성상, 안정적인 데이터 모델링을 위해 도입하였습니다.

### **State / Data Management**

- **Redux** — 전역 상태 관리 (유저 정보, 관리자 권한 등)
- **React Query** — Firestore 데이터 캐싱 및 서버 상태 관리  
  → Firebase Read 비용 최적화 및 데이터 일관성 유지
- **SQLite** — 로컬 데이터베이스  
  → 조회 데이터를 로컬 캐싱해 Firestore 요청을 최소화

### **Backend / Cloud Services**

- **Firebase Authentication** — 사용자/게스트 로그인 및 인증
- **Firebase Firestore** — 실시간 채팅, 채팅방 및 유저 데이터 저장
- **Firebase Cloud Functions** — FCM 발송, 관리자 승인 로직 등 서버 사이드 처리 자동화

### **Local DB / Storage**

- **SQLite**  
  → 메시지 및 목록 데이터를 저장해 빠른 로딩과 네트워크 비용 절감

### **Other Tools / Libraries**

- **FCM (Firebase Cloud Messaging)** — 실시간 메시지 푸시 알림 및 딥링크 네비게이션
- **onSnapshot (Firestore)** — 메시지 및 언리드 카운트 실시간 감지
- **Custom Hooks Architecture** — 목록 조회·언리드 카운트·신규 채팅 감지 기능을 모듈화
- **Firebase Security Rules** — 관리자 권한/유저 승인 기반 접근 제어

## 🗂 Project Structure

```bash
.
├─ android
├─ ios
├─ src
│  ├─ components      # 재사용 UI 컴포넌트
│  ├─ screens         # 화면 단위 컴포넌트
│  ├─ hooks           # 커스텀 훅
│  ├─ store           # 전역 상태 관리
│  ├─ services        # API / Firebase / 외부 연동
│  ├─ db              # SQLite 로직들
│  └─ utils           # 유틸 함수
└─ App.tsx
```
