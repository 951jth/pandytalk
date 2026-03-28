import {onDocumentWritten} from 'firebase-functions/v2/firestore'
import {syncGroupToChat} from '../../services/groupService'

/**
 * 그룹 멤버가 추가/탈퇴되거나 상태가 변경되었을 때 채팅방 멤버 목록을 동기화합니다.
 */
export const onGroupMembersUpdate = onDocumentWritten(
  {
    region: 'asia-northeast3',
    document: 'groups/{groupId}/members/{memberId}',
  },
  async event => {
    try {
      const groupId = event.params.groupId as string
      await syncGroupToChat(groupId)
    } catch (err) {
      console.error('[onGroupMembersUpdate] error', err)
    }
  },
)
