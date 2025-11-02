import * as admin from 'firebase-admin'
import * as logger from 'firebase-functions/logger'
import {
  onDocumentCreated,
  onDocumentUpdated,
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

//그룹의 멤버가 바뀌는 경우, 채팅방 멤버를 갱신하는 항목임
export const onGroupMembersUpdate = onDocumentUpdated(
  {region: 'asia-northeast3', document: 'groups/{groupId}/members/{memberId}'},
  async event => {
    try {
      const groupId = event.params.groupId as string
      // 1) 현재 멤버 전체 스냅샷 (정합성 우선: 전체 재계산)
      // ✅ isActive === false 인 멤버만 조회 (Admin SDK 체이닝)
      const membersSnap = await db
        .collection(`groups/${groupId}/members`)
        .where('isActive', '!=', false)
        .get()

      const receiverIds = membersSnap.docs.map(d => d.id) // 문서 ID=uid 권장

      const chatRef = db.doc(`chats/${groupId}`) //그룹채팅의 채팅아이디는 그룹채팅의 아이디와 동일
      console.log('receiverIds:', receiverIds)
      chatRef.set(
        {
          type: 'group',
          members: receiverIds,
          membersCount: receiverIds.length,
        },
        {merge: true},
      )
    } catch (err) {
      console.error('[onGroupMemberWrite] error', err)
    }
  },
)
