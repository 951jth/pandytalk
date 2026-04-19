# 🤖 AI Agent Master Rules & Guidelines

이 문서는 에이전트(AI)가 작업을 시작하기 전 반드시 준수해야 하는 **최상위 원칙**입니다. 모든 요청에 대해 이 규칙이 우선 적용됩니다.

---

## 🛑 1. 워크플로우 우선 원칙 (Mandatory Workflows)

특정 작업 시 반드시 지정된 워크플로우 문서(.md)를 먼저 읽고 그 절차를 따릅니다. **절대 워크플로우를 건너뛰거나 임의로 단축하지 마십시오.**

| 작업 유형 | 참조할 워크플로우 파일 |
| :--- | :--- |
| **커밋 및 푸시 (Push/Commit)** | [.agent/workflows/pushAndCommit.md](file:///d:/Coding/workspace/pandytalk/.agent/workflows/pushAndCommit.md) |
| **앱 버전업 (Version Bump)** | [.agent/workflows/release-versioning.md](file:///d:/Coding/workspace/pandytalk/.agent/workflows/release-versioning.md) |
| **EAS Update (CodePush)** | [.agent/workflows/eas-update.md](file:///d:/Coding/workspace/pandytalk/.agent/workflows/eas-update.md) |
| **프로젝트 회고록 작성** | [.agent/workflows/retrospective.md](file:///d:/Coding/workspace/pandytalk/.agent/workflows/retrospective.md) |

---

## 🗣️ 2. 소통 및 언어 규칙 (Communication Standards)

*   **한국어 우선**: 사용자와의 모든 대화, 제안, 설명은 **한국어**로 진행합니다.
*   **코드 주석**: 새로운 기능을 추가하거나 복잡한 로직을 수정할 때, 핵심 설명은 한국어 주석을 포함합니다.
*   **커밋 메시지**: **Conventional Commits** 형식을 준수하며, 내용은 한국어로 작성합니다.
    *   형식: `type: 한국어 설명 (필요시 상세설명)`
    *   예: `feat: 그룹 채팅 생성 시 멤버 초대 기능 추가`

---

## 🛡️ 3. 안전 및 실행 가드레일 (Safety Guardrails)

*   **파괴적 명령어**: `rm`, `git reset`, `git push -f`, `npm publish` 등 시스템에 돌이키기 힘든 변화를 주는 명령어는 반드시 사용자에게 **명시적 승인**을 얻은 후 실행합니다.
*   **네이티브 변경 알림**: `android/`, `ios/` 폴더 또는 `app.json`의 네이티브 설정을 변경할 때는 실행 전 **"네이티브 빌드가 필요한 변경"**임을 강력하게 경고해야 합니다.
*   **명령어 제안**: 복잡한 명령어는 사용자가 직접 복사해서 쓸 수 있도록 마크다운 코드 블록으로 먼저 제안합니다.

---

## 🏗️ 4. 기술 스택 및 품질 (Technical Excellence)

*   **React Native / Expo**: Expo Bare Workflow의 구조를 이해하고, 네이티브 모듈 연결 시 일관성을 유지합니다.
*   **코드 스타일**: 기존 프로젝트의 코드 컨벤션(Prettier, ESLint)을 존중하며, 일관된 코딩 스타일을 유지합니다.
*   **계획 기반 작업**: 대규모 수정이나 아키텍처 변경 시 반드시 `implementation_plan.md`를 통해 승인을 먼저 받습니다.

---

> [!IMPORTANT]
> 에이전트는 사용자가 "알아서 해줘"라고 말하더라도, 위의 **워크플로우 절차를 생략해서는 안 됩니다.**
