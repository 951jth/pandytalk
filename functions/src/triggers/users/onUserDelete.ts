import * as functions from 'firebase-functions/v1'
import {FieldPath, FieldValue, getFirestore} from 'firebase-admin/firestore'
import {getStorage} from 'firebase-admin/storage'
import {db} from '../../core/firebase'

// Storage: profiles/{uid}/ 밑의 모든 파일 삭제
async function deleteUserProfileFiles(uid: string) {
  const bucket = getStorage().bucket()
  const prefix = `profiles/${uid}/` // 👈 너가 말한 구조
  const [files] = await bucket.getFiles({prefix})

  if (!files.length) return

  await Promise.all(files.map(file => file.delete()))
  console.log(`Deleted ${files.length} files from ${prefix}`)
}

// 3. groups/*/members/* 에서 문서 ID == uid 인 멤버 삭제
async function deleteUserFromAllGroups(uid: string) {
  const db = getFirestore()

  // 1. 모든 'members' 하위 컬렉션에서 ID가 uid인 문서만 찾습니다.
  // (색인 생성이 필요할 수 있습니다)
  const membersSnap = await db
    .collectionGroup('members')
    .where(FieldPath.documentId(), '==', uid)
    .get()

  if (membersSnap.empty) return

  const batch = db.batch()

  // 2. 검색된 결과(내가 가입한 그룹의 멤버 문서들)만 순회합니다.
  membersSnap.forEach(memberDoc => {
    const groupRef = memberDoc.ref.parent.parent // members/uid 의 상위인 groups/groupId
    if (groupRef) {
      batch.delete(memberDoc.ref) // 내 멤버 정보 삭제
      batch.update(groupRef, {
        memberCount: FieldValue.increment(-1), // 실제 가입된 그룹만 -1
      })
    }
  })

  await batch.commit()
  console.log(
    `Removed user from ${membersSnap.size} groups and updated counts.`,
  )
}

/**
 * 유저가 포함된 모든 채팅방의 members 배열에서 해당 UID 제거
 */
async function cleanupUserChats(uid: string) {
  const db = getFirestore()

  // 유저가 포함된 모든 채팅방 조회
  const chatsSnap = await db
    .collection('chats')
    .where('members', 'array-contains', uid)
    .get()

  if (chatsSnap.empty) return

  const batch = db.batch()
  chatsSnap.forEach(chatDoc => {
    // members 배열에서 해당 UID 제거
    batch.update(chatDoc.ref, {
      members: FieldValue.arrayRemove(uid),
    })
  })

  await batch.commit()
  console.log(`Removed user ${uid} from ${chatsSnap.size} chat rooms`)
}

// Auth 유저가 삭제될 때마다 실행
export const onAuthUserDeleted = functions
  .region('asia-northeast3')
  .auth.user()
  .onDelete(async user => {
    const uid = user.uid

    const userRef = db.collection('users').doc(uid)

    try {
      // 1. chats/*/messages/* 에서 senderId == uid 인 메시지 삭제
      //    -> messages 는 모든 채팅방의 서브컬렉션 이름이라고 가정
      // const messagesQuery = db
      //   .collectionGroup('messages')
      //   .where('senderId', '==', uid)
      // await deleteByQuery(messagesQuery)

      // 2. users 컬렉션에서 내 user 문서 삭제
      await userRef.delete()

      // 3. groups/*/members/* 에서 문서 ID == uid 인 멤버 삭제
      await deleteUserFromAllGroups(uid)

      // 4. 채팅방 members 배열에서 UID 제거
      await cleanupUserChats(uid)

      // 5. Storage: profiles/{uid}/ 밑의 프로필 이미지들 삭제
      await deleteUserProfileFiles(uid)

      console.log(`Cleanup done for user: ${uid}`)
    } catch (err) {
      console.error(`Error cleaning up data for user ${uid}`, err)
    }
  })
