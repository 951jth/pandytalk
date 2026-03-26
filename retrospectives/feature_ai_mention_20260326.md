# 🚀 Feature Update: Pandibot AI Mention & Tavily Search (2026-03-26)

## 📌 개요
사용자들이 팬디봇(@팬디)에게 실시간 정보를 물어보고, 프로젝트 관련 지식을 답변받을 수 있도록 AI 멘션 기능을 대폭 강화하였습니다.

## ✨ 주요 변경 사항

### 1. 실시간 웹 검색 (Tavily Search) 통합
- **OpenAI Tools (Function Calling)**를 도입하여 봇이 스스로 검색이 필요한 시점을 판단합니다.
- **Tavily Search API**를 연동하여 최신 뉴스, 날씨, 주가 등 실시간 정보를 답변에 반영합니다.
- Firebase Functions 내에서 가벼운 **Native fetch**를 사용하여 성능을 최적화했습니다.

### 2. 프로젝트 지식 주입 (RAG-lite)
- `architecture.md`, `README.md` 등 프로젝트 핵심 문서를 요약하여 시스템 프롬프트에 제공합니다.
- 이제 팬디봇이 PandyTalk의 아키텍처(Local-First, SQLite 등)에 대해 전문적으로 답변할 수 있습니다.

### 3. 채팅 목록 정렬 로직 개선
- 채팅 목록을 마지막 메시지 생성 시간(`lastMessage.createdAt`) 기준으로 정렬하여 사용자 경험을 개선했습니다.
- 클라이언트 사이드(`useChatListScreen.ts`)와 서버 사이드(Firestore query)를 모두 최적화했습니다.

### 4. UI/UX 개선
- **Mention Suggestion 자동 해제**: 키보드가 닫힐 때 멘션 추천 칩이 함께 사라지도록 개선했습니다.
- **Flex Flow 레이아웃**: 멘션 추천창이 채팅 목록을 가리지 않고 자연스럽게 밀어내도록 구조를 변경했습니다.

## 🛠️ 기술적 의의
- **보안 강화**: API 키를 `Firebase Secrets`로 관리하여 소스코드 유출을 방지했습니다.
- **서버 타임스탬프 동기화**: 모든 메시지 생성 시간을 `FieldValue.serverTimestamp()`로 통일하여 데이터 정합성을 확보했습니다.
- **Node.js 22 최적화**: 최신 Node.js 환경에서 내장 `fetch`를 활용한 외부 API 연동을 성공적으로 구현했습니다.

---
**기록자**: Antigravity (AI Coding Assistant)
**상태**: 배포 완료 (Firebase Functions & Android v1.2.2 Build)
