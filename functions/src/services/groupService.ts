import {db} from '../core/firebase'

/**
 * 플랫폼 전체 관리자 UID 목록
 */
export const PLATFORM_ADMIN_UIDS: string[] = (process.env.PLATFORM_ADMINS ?? '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

/**
 * 그룹 정보를 기반으로 채팅방 정보를 동기화합니다.
 */
export async function syncGroupToChat(groupId: string) {
  // 1) 그룹 메타 정보 읽기
  const groupDocRef = db.doc(`groups/${groupId}`)
  const groupSnap = await groupDocRef.get()

  if (!groupSnap.exists) {
    console.warn(`[syncGroupToChat] group not found: ${groupId}`)
    return
  }

  const groupData = groupSnap.data() || {}
  const groupName = groupData.name ?? ''
  const groupImage = groupData.image ?? groupData.photoURL ?? ''

  // 2) 활성 멤버 전체 조회
  const membersSnap = await db
    .collection(`groups/${groupId}/members`)
    .where('isActive', '==', true)
    .get()

  const memberIds = membersSnap.docs.map(d => d.id)

  // 3) chats/{groupId} 업데이트
  const chatRef = db.doc(`chats/${groupId}`)

  await chatRef.set(
    {
      type: 'group',
      groupId,
      name: groupName,
      image: groupImage,
      members: memberIds,
      membersCount: memberIds.length,
    },
    {merge: true},
  )

  console.log('[syncGroupToChat] synced', {
    groupId,
    membersCount: memberIds.length,
  })
}
