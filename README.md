# PandyTalk

👉 **Live App (Android)**: Google Play – [PandyTalk](https://play.google.com/store/apps/details?id=com.cshchatapp)
👉 **Performance & Architecture Notes**: [Notion](https://www.notion.so/Engineering-Log-30159549cbc0800286f9faf3a378fda2?pvs=12)

오프라인 환경에서도 **항상 동일한 메시지 순서와 화면을 제공**하기 위해  
SQLite를 조회 기준으로 설계한 React Native 기반 채팅 앱입니다.

---

## 📌 Overview

이 프로젝트는 실시간 채팅 서비스에서 자주 발생하는  
**메시지 누락, 순서 불일치, 네트워크 의존성 문제**를  
구조적으로 해결하는 것을 목표로 한 개인 프로젝트입니다.

실시간 반영 속도보다 **“항상 같은 결과를 보여주는 UX”**를 우선하는 방향으로 판단하여,  
Firestore 기반 실시간 구독과 SQLite 기반 로컬 조회를 분리한  
오프라인 퍼스트 아키텍처를 설계·검증했습니다.

---

## 🎯 핵심 문제 & 판단

- Firestore persistence만으로는  
  오프라인·장기 미접속 구간에서 일관된 메시지 조회 UX를 보장하기 어려움
- 네트워크 상태에 따라 사용자마다 다른 메시지 순서·목록이 노출되는 문제 발생
- 실시간성과 UX 일관성 사이에서 **일관성을 우선하는 설계 판단**을 선택

### 핵심 결정

- SQLite를 단순 캐시가 아닌 **조회 기준 데이터 소스**로 사용
- 실시간 구독(Firestore)은 “미래 데이터 동기화” 역할로 분리

---

## 🧠 Architecture Overview

- **Service Layer**
  - 도메인 정책, 상태 흐름 관리
  - 중복 요청 및 순서 불일치 방지

- **Data Layer**
  - Local: SQLite (조회 기준)
  - Remote: Firestore (실시간 구독 / 동기화)

> 실시간 데이터와 조회 데이터를 분리하여  
> 네트워크 상태와 관계없이 동일한 화면 결과를 보장하도록 설계

---

## ✨ Core Features

### 1. 실시간 + 오프라인 채팅 구조

- Firestore `onSnapshot` 기반 실시간 메시지 수신
- SQLite 기반 로컬 조회로 오프라인·지연 환경에서도 동일한 메시지 순서 유지

### 2. 채팅방 리스트 & 언리드 동기화

- 채팅방 목록, 언리드 카운트, 신규 메시지 감지를
  기능 단위 커스텀 훅으로 분리
- 불필요한 리렌더링 및 리스너 최소화

### 3. FCM 푸시 알림 & 딥링크

- 신규 메시지 수신 시 Firebase Cloud Messaging 기반 알림 발송
- 알림 클릭 시 해당 채팅방으로 즉시 이동하도록 딥링크 구성

---

## 📊 Results

| 구분                  | 평균 속도     | 안정성 (지터)          | UX 등급                   |
| :-------------------- | :------------ | :--------------------- | :------------------------ |
| **Firestore (Cloud)** | **~286.74ms** | 낮음 (최대 535ms)      | 보통 (네트워크 대기 발생) |
| **SQLite (Local)**    | **~9.24ms**   | **매우 높음 (±1.5ms)** | **최상 (즉각적인 응답)**  |

---

## 🧰 Tech Stack

### App Framework

- React Native (`@react-native-community/cli`)

### Language

- TypeScript

### State / Data

- React Query (서버 상태 관리)
- Redux (전역 상태 일부)
- SQLite (로컬 데이터베이스)
- Firebase Firestore / FCM

### Backend / Cloud

- Firebase Authentication
- Firebase Firestore
- Firebase Cloud Functions (FCM 발송, 관리자 승인 로직)

---

## 🗂 Project Structure

<details>
<summary>Feature-based Architecture 구조 보기</summary>

```bash
app
├─ bootstrap          # 앱 초기화 로직
├─ features           # 도메인 단위 기능 모듈
│  ├─ auth
│  ├─ chat
│  ├─ group
│  ├─ notification
│  └─ user
├─ navigation         # 네비게이션 구성
├─ shared             # 공용 레이어 (firebase, sqlite, ui, utils)
└─ store              # 최소한의 전역 상태
```
