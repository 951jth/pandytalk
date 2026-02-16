// # 로그인
// firebase login

// # 배포 명령어
// firebase deploy --only functions
// firebase deploy --only functions:functionName    # 특정 함수만
// firebase deploy --only functions:triggers/*      # 트리거 함수들만

// # 변경 확인 (로그 또는 Firebase 콘솔)
// firebase functions:log
// firebase functions:log --only "functionName"     # 특정 함수 로그만
// firebase functions:log --limit 10                 # 최근 10개만
// firebase functions:log --start "1h"               # 지난 1시간치만

export {sendNewMessageNotification} from './triggers/chats/onNewMessage'
export {
  onGroupCreate,
  onGroupMembersUpdate,
  onGroupMetaUpdate,
} from './triggers/groups/onGroupWrite'
export {onUserApprove} from './triggers/users/onUserApprove'
export {onAuthUserDeleted} from './triggers/users/onUserDelete'
export {onUserGroupIdUpdated} from './triggers/users/onUserUpdate'

// 테스트 전용 함수
/*
curl -X POST https://asia-northeast3-csh-rn.cloudfunctions.net/setupTestDummyData \
-H "Content-Type: application/json" \
-d '{"data": {}}'
*/
export {setupTestDummyData} from './triggers/test/setupDummy'
/*
curl -X POST https://asia-northeast3-csh-rn.cloudfunctions.net/testDbPerformanceCompare \
-H "Content-Type: application/json" \
-d '{"data": {"memberCount": 100}}'
*/
export {testDbPerformanceCompare} from './triggers/test/pushBenchmark'
/*
curl -X POST https://asia-northeast3-csh-rn.cloudfunctions.net/sendDummyMessages \
-H "Content-Type: application/json" \
-d '{"data": {"roomId": "mKn39zVd5MgDIse1KuPg", "count": 100}}'
*/
export {sendDummyMessages} from './triggers/test/sendDummyMessages'
