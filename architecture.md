# 📄 Project Architecture Overview

본 프로젝트는 유지보수성과 확장성을 높이기 위해  
**Feature-Based Architecture** 를 기반으로 구성되었습니다.  
기능 단위로 코드를 모듈화하여 응집도를 높이고, UI·상태·로직을 명확히 분리하는 것을 목표로 합니다.

---

## 🎯 핵심 원칙

1. **기능(도메인) 중심 폴더 구조**
   - `chat`, `users`, `groups` 등 기능을 기준으로 화면·컴포넌트·훅·로직을 구성

2. **UI · 상태 · 비즈니스 로직 분리**
   - **Screen:** 화면 UI 구성
   - **Hook:** 상태 관리 & 데이터 로딩
   - **Service / Repository:** 비즈니스 로직 및 데이터 접근

3. **공용 요소와 도메인 요소의 분리**
   - 공통 UI → `components/`
   - 도메인 전용 UI → `features/*/components`

---

## 📁 Folder Structure

app/
assets/ # 이미지, 폰트 등 정적 리소스
components/ # 공용 UI 컴포넌트 (도메인 의존성 없음)
constants/ # 전역 상수
contexts/ # React Context 전역 제공자
db/ # SQLite schema, migrations, 초기화 로직
features/ # 도메인 단위 기능 모듈 (UI + Hooks + Logic)
hooks/ # 전역적으로 재사용되는 공용 훅
navigation/ # 네비게이션 스택 및 타입 정의
repositories/ # Firebase/SQLite 등 데이터 접근 레이어
services/ # 비즈니스 로직 레이어
store/ # 글로벌 상태 관리(Zustand 등)
types/ # 전역 타입 정의
utils/ # 유틸리티 함수

## 🔄 Data Flow

┌────────────────┐
│ Screen │ → UI
└───────┬────────┘
│ uses
┌───────▼────────┐
│ Hook │ → State + Query
└───────┬────────┘
│ calls
┌───────▼────────┐
│ Service │ → Business Logic
└───────┬────────┘
│ calls
┌───────▼────────┐
│ Repository │ → Data Access (Firebase/DB)
└───────┬────────┘
│ calls
┌───────▼────────┐
│ Firebase / DB │ → Infra
└────────────────┘
