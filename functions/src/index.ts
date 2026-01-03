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
