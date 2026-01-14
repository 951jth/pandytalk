import * as admin from 'firebase-admin'
import {FieldValue} from 'firebase-admin/firestore'
import * as functions from 'firebase-functions'
import {db} from '../../core/firebase'

const bucket = admin.storage().bucket()

// Storage: profiles/{uid}/ 밑의 모든 파일 삭제
async function deleteUserProfileFiles(uid: string) {
  const prefix = `profiles/${uid}/` // 👈 너가 말한 구조
  const [files] = await bucket.getFiles({prefix})

  if (!files.length) return

  await Promise.all(files.map(file => file.delete()))
  console.log(`Deleted ${files.length} files from ${prefix}`)
}

// 3. groups/*/members/* 에서 문서 ID == uid 인 멤버 삭제
async function deleteUserFromAllGroups(uid: string) {
  const db = admin.firestore()

  const groupsSnap = await db.collection('groups').get()

  const batches: FirebaseFirestore.WriteBatch[] = []
  let batch = db.batch()
  let opCount = 0

  groupsSnap.forEach(groupDoc => {
    // 1. 멤버 하위 컬렉션에서 유저 삭제
    const memberRef = groupDoc.ref.collection('members').doc(uid)
    batch.delete(memberRef)

    // 2. 그룹 문서의 memberCount -1 감소 (Atomically)
    batch.update(groupDoc.ref, {
      memberCount: FieldValue.increment(-1),
    })

    // ⭐ 중요: 작업이 2개 추가됐으니 카운트도 2 증가!
    opCount += 2

    // Firestore batch는 500 writes 제한 (여유 있게 450쯤에서 끊기)
    if (opCount >= 450) {
      batches.push(batch)
      batch = db.batch()
      opCount = 0
    }
  })

  if (opCount > 0) {
    batches.push(batch)
  }

  // 순차 커밋
  for (const b of batches) {
    await b.commit()
  }
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

      // 4. Storage: profiles/{uid}/ 밑의 프로필 이미지들 삭제
      await deleteUserProfileFiles(uid)

      console.log(`Cleanup done for user: ${uid}`)
    } catch (err) {
      console.error(`Error cleaning up data for user ${uid}`, err)
    }
  })
