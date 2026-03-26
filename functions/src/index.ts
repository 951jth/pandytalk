export {onAiMention} from './triggers/chats/onAiMention'
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
// 더미 그룹 생성하기 (유저포함)
export {setupTestDummyData} from './triggers/test/setupDummy'
// 푸쉬메세지 병렬처리 속도확인하기
export {testDbPerformanceCompare} from './triggers/test/pushBenchmark'
// 더미 메시지 생성하기
export {sendDummyMessages} from './triggers/test/sendDummyMessages'
