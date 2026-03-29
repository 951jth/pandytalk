---
description: EAS Build (Android/iOS 네이티브 빌드) 실행 방법
---

// turbo-all
사용자가 "빌드해줘", "EAS 빌드", `/eas-build` 등의 키워드로 작업을 요청하면 다음 단계를 자동으로 수행하세요:

1. 현재 변경 사항이 모두 커밋되었는지 확인합니다. (미커밋 시 빌드가 불가능하므로 선행 커밋 유도)
2. 현재 `app.json`의 `version` 및 `runtimeVersion`이 적절한지 사용자에게 한 번 더 인지시킵니다.
3. 다음 명령어를 실행합니다:
   - 안드로이드: `npx eas-cli build --platform android --profile production --no-wait`
   - iOS: `npx eas-cli build --platform ios --profile production --no-wait`
   - (참고: `--no-wait` 옵션은 서버에서 빌드되는 동안 로컬 터미널을 점유하지 않기 위함입니다.)
4. 빌드가 시작되면 대시보드 URL을 안내하고 완료를 보고합니다.
