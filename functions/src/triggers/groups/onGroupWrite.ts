import * as admin from 'firebase-admin'
import * as logger from 'firebase-functions/logger'
import {
  onDocumentCreated,
  onDocumentUpdated,
  onDocumentWritten,
} from 'firebase-functions/v2/firestore'
import {db} from '../../core/firebase'

// ① 플랫폼 전체 관리자를 자동 참여시키고 싶다면, 환경변수/설정에서 불러오세요.
//   - 방법 A: .env(Firebase Config) → process.env.PLATFORM_ADMINS = "uid1,uid2"
//   - 방법 B: Firestore 설정 문서(/config/app)에서 읽기
const PLATFORM_ADMIN_UIDS: string[] = (process.env.PLATFORM_ADMINS ?? '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

export const onGroupCreate = onDocumentCreated(
  {
    region: 'asia-northeast3',
    document: 'groups/{groupId}',
  },
  async event => {
    const groupId = event.params.groupId as string
    const group = event.data?.data() || {}
    const ownerId: string | undefined = group.ownerId
    const name: string | undefined = group.name
    const image: string | undefined = group.photoURL

    // const platformAdmins = await getPlatformAdminsFromDoc() // (문서에서 읽을 경우)
    const platformAdmins = PLATFORM_ADMIN_UIDS

    // 초기 멤버 구성: 오너 + 플랫폼 관리자들
    const initialMemberSet = new Set<string>(platformAdmins)
    if (ownerId) initialMemberSet.add(ownerId)

    // 멤버 역할 매핑 (오너는 OWNER, 나머지는 ADMIN)
    const roleOf = (uid: string): 'OWNER' | 'ADMIN' => {
      if (ownerId && uid === ownerId) return 'OWNER'
      return 'ADMIN'
    }

    // 1) chats/{groupId} 생성(그룹 채팅 1:1 매핑)
    // 2) groups/{groupId}/members/{uid} 생성/활성
    // 3) groups/{groupId}.memberCount 캐시
    const batch = db.batch() //한번에 여러
    const now = Date.now()

    // (1) 채팅방 문서
    const chatRef = db.doc(`chats/${groupId}`)
    batch.set(
      chatRef,
      {
        type: 'group',
        groupId,
        name: name ?? null,
        image: image ?? null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
        // 선택: 생성 시점 멤버 스냅샷
        members: Array.from(initialMemberSet),
      },
      {merge: true},
    )

    // (2) group members set
    for (const uid of initialMemberSet) {
      const memRef = db.doc(`groups/${groupId}/members/${uid}`)
      batch.set(
        memRef,
        {
          role: roleOf(uid),
          isActive: true,
          joinedAt: now,
          leftAt: null,
        },
        {merge: true},
      )
    }

    // (3) 멤버 수 캐시
    const groupRef = db.doc(`groups/${groupId}`)
    batch.set(groupRef, {memberCount: initialMemberSet.size}, {merge: true})

    await batch.commit()
    logger.info('onGroupCreated: initialized chat & members', {
      groupId,
      ownerId,
      admins: platformAdmins,
      memberCount: initialMemberSet.size,
    })

    // (선택) 환영 시스템 메시지 한 건 남기기
    // await db.collection(`chats/${groupId}/messages`).add({
    //   type: 'system',
    //   text: '그룹이 생성되었습니다.',
    //   createdAt: admin.firestore.FieldValue.serverTimestamp(),
    // })
  },
)

async function syncGroupToChat(groupId: string) {
  // 1) 그룹 메타 정보 읽기
  const groupDocRef = db.doc(`groups/${groupId}`)
  const groupSnap = await groupDocRef.get()

  if (!groupSnap.exists) {
    console.warn(`[syncGroupToChat] group not found: ${groupId}`)
    return
  }

  const groupData = groupSnap.data() || {}
  const groupName = groupData.name ?? ''
  const groupImage = groupData.image ?? groupData.photoURL ?? '' // 둘 다 호환해주고 싶으면 이렇게

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
      // createdAt, lastMessage, lastMessageAt 등은 최초 생성 시에만 세팅하고
      // 여기선 건드리지 않는게 보통 좋음
    },
    {merge: true},
  )

  console.log('[syncGroupToChat] synced', {
    groupId,
    membersCount: memberIds.length,
  })
}

//그룹의 멤버가 바뀌는 경우, 채팅방 멤버를 갱신하는 항목임
// 그룹 멤버가 바뀌었을 때 (추가/탈퇴/isActive 변경)
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

// 그룹 문서의 name/image 등이 변경되었을 때
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

      // name, image 둘 다 안 바뀐 경우에는 스킵해도 됨 (옵션)
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
