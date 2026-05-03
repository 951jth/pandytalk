// --- 채팅 트리거 ---
export {onAiMention} from './triggers/chats/onAiMention'
export {sendNewMessageNotification} from './triggers/chats/onNewMessage'

// --- 그룹 트리거 ---
export {onGroupCreate} from './triggers/groups/onGroupCreate'
export {onGroupMembersUpdate} from './triggers/groups/onGroupMembersUpdate'
export {onGroupMetaUpdate} from './triggers/groups/onGroupMetaUpdate'

// --- 사용자 트리거 ---
export {cleanupInactiveUsers} from './triggers/users/cleanupInactiveUsers'
export {onUserApprove} from './triggers/users/onUserApprove'
export {onAuthUserDeleted} from './triggers/users/onUserDelete'
export {onUserGroupIdUpdated} from './triggers/users/onUserUpdate'

// --- AI 하이브리드 스트리밍 및 엔드포인트 ---
export {onAiStream} from './triggers/chats/onAiStream'
export {onAiStreamBackup} from './triggers/chats/onAiStreamBackup'

// --- 테스트 전용 함수 ---
// 더미 그룹 생성하기 (유저포함)
export {setupTestDummyData} from './triggers/test/setupDummy'
// 푸쉬메세지 병렬처리 속도확인하기
export {testDbPerformanceCompare} from './triggers/test/pushBenchmark'
// 더미 메시지 생성하기
export {sendDummyMessages} from './triggers/test/sendDummyMessages'
// AI 일반 응답과 스트리밍 응답 체감 속도 비교하기
export {testAiStreamBenchmark} from './triggers/test/aiStreamBenchmark'
