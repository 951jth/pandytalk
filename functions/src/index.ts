// 트리거
export {sendNewMessageNotification} from './triggers/chats/onNewMessage'
export {
  onGroupCreate,
  onGroupMembersUpdate,
  onGroupMetaUpdate,
} from './triggers/groups/onGroupWrite'
export {onAuthUserDeleted} from './triggers/users/onUserDelete'
export {onUserGroupIdUpdated} from './triggers/users/onUserUpdate'
//firebase login
//firebase deploy --only functions 로 배포 or
// firebase deploy --only "functions:onGroupCreate"
