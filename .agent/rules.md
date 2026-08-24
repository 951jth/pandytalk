# AI 에이전트 마스터 룰 & 가이드라인

이 저장소에서 작업하는 AI 에이전트에게 최우선으로 적용되는 규칙입니다. 특정 작업 수행 시 아래 매핑표의 워크플로우를 반드시 **먼저** 확인하세요.

## 1. 워크플로우 라우팅

명령을 제안하거나 실행하기 전, 작업 유형에 맞는 워크플로우 파일을 먼저 읽고 따르세요.

- **git, commit, push, branch, merge, PR:** `.agent/workflows/pushAndCommit.md`
- **버전 업, 빌드 번호, release, runtime version:** `.agent/workflows/release-versioning.md`
- **EAS Build, EAS Update, deploy, OTA:** `.agent/workflows/eas-update.md`
- **프로젝트 자동화, 프로젝트 회고록 작성:** `.agent/workflows/retrospective.md`
- **새 기능 추가, API 변경, UI/스크린 리팩터링:** `.agent/workflows/architecture.md`

> 중요: 사용자가 명시적으로 실행을 요청하지 않는 한 임의로 커밋/푸시하지 않으며, 워크플로우를 건너뛰지 않습니다. 워크플로우 적용 시 응답에 명시하세요.

## 2. 커뮤니케이션 규칙

- 설명, 요약, 명령 제안은 **한국어**를 기본으로 사용합니다.
- 한국어 텍스트는 인코딩 손상을 주의 깊게 보존하며 임의로 수정/재작성하지 않습니다. 
- 터미널 출력에서 mojibake가 보여도 파일이 손상되었다고 오판하지 않습니다. (파일 읽기 시 `Get-Content -Encoding UTF8` 사용)
- 커밋 메시지는 Conventional Commits 형식을 따릅니다. (타입/스코프는 영어, 설명은 한국어)
- 명령 제안은 마크다운 코드 블록으로 바로 복사할 수 있게 제공합니다.

## 3. 안전 및 실행 가드레일

- `rm`, `git reset`, `git push -f`, `npm publish` 등 **파괴적인 명령은 사용자 명시적 승인 없이 실행 불가**합니다.
- 네이티브 파일(`android/`, `ios/`, `app.json`, `app.config.js` 등) 변경 시, 빌드/업데이트가 필요할 수 있음을 경고하세요.
- 커밋/푸시 제안 전 `git status`로 상태를 확인하세요.
- `npm`, `npx`, `yarn`, EAS, 빌드, 전체 테스트/lint 등 **구동이 오래 걸리는 명령은 자동 실행하지 않습니다.** 
- 검증 실패(예: 샌드박스 오류) 시 무단 재시도하지 않으며, 정적 점검 후 사용자 확인을 받으세요.
- 대규모 변경 사항은 편집 전에 구현 계획을 먼저 작성하거나 사용자에게 확인받으세요.
