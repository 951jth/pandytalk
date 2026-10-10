# PR 검증과 수동 머지

## 흐름

develop에 push → main 대상 PR → 린트·타입 체크·테스트 및 Codex 리뷰 → 결과 확인 → 사용자가 머지 → main에서 CI 재검증 → 성공 시 기존 EAS Update 실행.

Codex 리뷰와 GitHub Actions는 별도 검사이며 동시에 실행될 수 있습니다. Codex의 Completed는 타입 체크나 테스트 성공을 의미하지 않습니다. 이 워크플로우는 Codex 실행 순서를 제어하지 않습니다.

## CI 통과 조건

- main 대상 PR에서 변경 경로와 관계없이 실행합니다. 새 커밋이 PR에 추가돼도 재실행합니다.
- Lint, Typecheck, Unit Tests를 독립적으로 실행합니다. 하나가 실패해도 다른 검사 결과를 확인할 수 있습니다.
- 최종 `Lint, Typecheck and Test` 검사는 항상 실행하며, 모든 검사가 성공한 경우에만 통과합니다. 실패·취소·생략은 통과로 처리하지 않습니다.
- main push의 기존 경로 조건과 배포 대상은 유지합니다. EAS Update는 최종 CI 성공 후 main push에서만 실행합니다.

## GitHub에서 반드시 적용할 설정

워크플로우 파일만으로는 머지를 차단할 수 없습니다.

1. 저장소 Settings → Branches → main 대상 보호 규칙을 생성하거나 수정합니다. Rulesets를 사용한다면 main 대상 브랜치 ruleset에 동일한 조건을 적용합니다.
2. Require a pull request before merging을 활성화합니다.
3. Require status checks to pass before merging을 활성화하고 `Lint, Typecheck and Test`를 필수 검사로 선택합니다. 해당 검사 이름이 없으면 변경된 워크플로우를 PR에서 한 번 실행한 뒤 선택합니다.
4. Require branches to be up to date before merging을 활성화합니다.
5. 관리자도 우회하지 못하도록 Do not allow bypassing the above settings를 활성화합니다. Rulesets에서는 우회 허용 대상을 비워둡니다.
6. 실패한 CI가 있는 PR의 머지가 차단되는지 확인합니다. Codex 리뷰 내용은 머지 전에 직접 확인합니다.

현재 브랜치 보호 설정 적용 여부는 확인되지 않았습니다. 네이티브 변경 시 OTA 차단도 아직 구현되지 않았습니다.