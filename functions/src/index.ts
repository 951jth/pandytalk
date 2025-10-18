// 트리거
export {sendNewMessageNotification} from './triggers/chats/onNewMessage'
export {onGroupMembersUpdate} from './triggers/groups/onGroupWrite'
export {onUserGroupIdUpdated} from './triggers/users/onUserUpdate'
//firebase deploy --only functions 로 배포 or
// firebase deploy --only "functions:onGroupMembersUpdate"
