import * as logger from 'firebase-functions/logger'
import {FieldValue} from 'firebase-admin/firestore'
import {onDocumentCreated} from 'firebase-functions/v2/firestore'
import {db} from '../../core/firebase'
import {PLATFORM_ADMIN_UIDS} from '../../services/groupService'

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

    const platformAdmins = PLATFORM_ADMIN_UIDS

    // 초기 멤버 구성: 오너 + 플랫폼 관리자들
    const initialMemberSet = new Set<string>(platformAdmins)
    if (ownerId) initialMemberSet.add(ownerId)

    // 멤버 역할 매핑 (오너는 OWNER, 나머지는 ADMIN)
    const roleOf = (uid: string): 'OWNER' | 'ADMIN' => {
      if (ownerId && uid === ownerId) return 'OWNER'
      return 'ADMIN'
    }

    const batch = db.batch()

    // (1) 채팅방 문서
    const chatRef = db.doc(`chats/${groupId}`)
    batch.set(
      chatRef,
      {
        type: 'group',
        groupId,
        name: name ?? null,
        image: image ?? null,
        createdAt: FieldValue.serverTimestamp(),
        lastMessageAt: FieldValue.serverTimestamp(),
        members: Array.from(initialMemberSet),
      },
      {merge: true},
    )

    // (2) 멤버 정보
    for (const uid of initialMemberSet) {
      const memRef = db.doc(`groups/${groupId}/members/${uid}`)
      batch.set(
        memRef,
        {
          role: roleOf(uid),
          isActive: true,
          joinedAt: FieldValue.serverTimestamp(),
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
  },
)
