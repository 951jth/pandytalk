import {onDocumentUpdated} from 'firebase-functions/v2/firestore'
import {syncGroupToChat} from '../../services/groupService'

/**
 * 그룹의 이름이나 이미지 등 메타데이터가 변경되었을 때 채팅방 정보를 동기화합니다.
 */
export const onGroupMetaUpdate = onDocumentUpdated(
  {
    region: 'asia-northeast3',
    document: 'groups/{groupId}',
  },
  async event => {
    try {
      const groupId = event.params.groupId as string

      const before = event.data?.before.data() || {}
      const after = event.data?.after.data() || {}

      // 주요 필드(name, image)의 변경 여부 확인
      const nameChanged = before.name !== after.name
      const imageChanged = before.image !== after.image

      if (!nameChanged && !imageChanged) {
        console.log('[onGroupMetaUpdate] no relevant changes, skip', groupId)
        return
      }

      await syncGroupToChat(groupId)
    } catch (err) {
      console.error('[onGroupMetaUpdate] error', err)
    }
  },
)
