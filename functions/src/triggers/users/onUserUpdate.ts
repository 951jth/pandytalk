import * as admin from 'firebase-admin'
import {onDocumentUpdated} from 'firebase-functions/v2/firestore'
import {db} from '../../core/firebase'

export const onUserGroupIdUpdated = onDocumentUpdated(
  {region: 'asia-northeast3', document: 'users/{uid}'},
  async event => {
    const uid = event.params.uid as string
    const before = event.data?.before
    const after = event.data?.after
    if (!before || !after) return

    const prevGroupId = (before.get('groupId') as string | null) ?? null
    const nextGroupId = (after.get('groupId') as string | null) ?? null
    if (prevGroupId === nextGroupId) return

    await db.runTransaction(async tx => {
      const ts = admin.firestore.FieldValue.serverTimestamp()

      // ---------- READ PHASE ----------
      // (읽기가 필요하면 여기서만 수행)
      let roomSnap: FirebaseFirestore.DocumentSnapshot | null = null
      let roomRef: FirebaseFirestore.DocumentReference | null = null
      if (nextGroupId) {
        roomRef = db.doc(`chats/${nextGroupId}`)
        roomSnap = await tx.get(roomRef) // ✅ 모든 write 전에 read
      }

      // ---------- WRITE PHASE ----------
      if (prevGroupId) {
        const prevMem = db.doc(`groups/${prevGroupId}/members/${uid}`)
        const prevChat = db.doc(`users/${uid}/chats/${prevGroupId}`)
        const prevGroup = db.doc(`groups/${prevGroupId}`)

        tx.set(prevMem, {isActive: false, leftAt: ts}, {merge: true})
        tx.delete(prevChat)
        tx.set(
          prevGroup,
          {memberCount: admin.firestore.FieldValue.increment(-1)},
          {merge: true},
        )
      }

      if (nextGroupId) {
        const nextMem = db.doc(`groups/${nextGroupId}/members/${uid}`)
        // const nextChat = db.doc(`users/${uid}/chats/${nextGroupId}`)
        const nextGroup = db.doc(`groups/${nextGroupId}`)

        // 기본 채팅방 보장: 최초 생성시에만 createdAt 기록
        if (roomRef && roomSnap && !roomSnap.exists) {
          tx.set(roomRef, {
            groupId: nextGroupId,
            type: 'group',
            isDefault: true,
            createdAt: ts,
            lastMessage: null,
          })
        }

        tx.set(
          nextMem,
          {role: 'MEMBER', isActive: true, joinedAt: ts, leftAt: null},
          {merge: true},
        )

        // tx.set(
        //   nextChat,
        //   {
        //     chatId: nextGroupId, // chatId = groupId 모델
        //     type: 'group',
        //     groupId: nextGroupId,
        //     lastMessageAt: ts,
        //   },
        //   {merge: true},
        // )

        tx.set(
          nextGroup,
          {memberCount: admin.firestore.FieldValue.increment(1)},
          {merge: true},
        )
      }
    })

    // batch 사용 안 하므로 제거
    // await batch.commit()  // ❌ 삭제
  },
)
