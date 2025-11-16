import {getApp} from '@react-native-firebase/app'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
} from '@react-native-firebase/firestore'
// import {FieldValue} from 'firebase-admin/firestore'
import type {User} from '../types/auth'
import type {ChatListItem, ChatMessage, ServerTime} from '../types/chat'
import {toRNFTimestamp} from '../utils/firebase'
import {removeEmpty} from '../utils/format'

const firestore = getFirestore(getApp())

//채팅방 id 조회
export const getDirectMessageRoomId = async (
  myUid: string,
  targetUid: string,
): Promise<string | null> => {
  try {
    const chatsRef = collection(firestore, 'chats')
    const q = query(
      chatsRef,
      where('type', '==', 'dm'),
      where('members', 'array-contains', myUid),
    )

    const snapshot = await getDocs(q)

    const existingRoom = snapshot.docs.find(doc => {
      const members = doc.data().members
      return members?.length == 2 && members.includes(targetUid)
    })

    return existingRoom ? existingRoom.id : null
  } catch (e) {
    console.log(e)
    return null
  }
}

//타입별 멤버 조회 호출 함수,(dm, group) : 과거
//멤버 정보가 바뀌게 될 수 있어서, id로 별도로 조회해야함.
const setChatMembersInfo = async (roomInfo: ChatListItem) => {
  try {
    //현재는 그룹의 멤버가 변경되면 클라우드펑션에서 자동으로 채팅멤버 세팅해줘서 사용 switch 문 사용하지않음
    let uids = roomInfo?.members ?? []
    // //1. 멤버 아이디들 세팅
    // switch (roomInfo.type) {
    //   //CASE 1. DM 채팅 (1:1, or 1:N) uids
    //   case 'dm':
    //     uids = roomInfo?.members ?? []
    //     break
    //   //CASE 2. GROUP 채팅 uids
    //   case 'group':
    //     const gid = roomInfo?.groupId as string
    //     if (!gid) return roomInfo
    //     const groupMemsRef = collection(firestore, 'groups', gid, 'members')
    //     const gq = query(groupMemsRef)
    //     const gSnapshot = await getDocs(gq)
    //     const gMembers =
    //       gSnapshot?.docs?.map(
    //         doc =>
    //           ({
    //             id: doc.id,
    //             ...doc.data(),
    //           }) as User,
    //       ) || []
    //     uids = gMembers?.map(e => e.id as string) ?? []

    //     break
    // }
    //2. id를 기반으로 현재 멤버들의 정보 세팅
    if (uids) {
      // users 컬렉션에서 해당 uid들의 유저 정보 가져오기
      const usersRef = collection(firestore, 'users')
      // ⚠️ Firestore의 where('uid', 'in', [...])는 최대 10개까지 지원
      const q = query(usersRef, where('uid', 'in', uids.slice(0, 10))) // 제한 고려

      const snapshot = await getDocs(q)

      const memberInfos =
        snapshot?.docs?.map(
          doc =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as User,
        ) || []
      roomInfo.members = uids
      roomInfo.memberInfos = memberInfos
    }
    return roomInfo
  } catch (e) {
    console.log(e)
    return roomInfo
  }
}

//채팅방 정보 조회 (멤버 및 채팅방 정보들들)
export const getChatRoomInfo = async (
  roomId: string,
): Promise<ChatListItem | void> => {
  // 1. chats/{roomId} 문서에서 members 배열 가져오기
  try {
    if (!roomId) return
    console.log('roomId: ', roomId)
    const chatDocRef = doc(firestore, 'chats', roomId)
    const chatSnap = await getDoc(chatDocRef)
    if (!chatSnap.exists()) {
      throw new Error('채팅방이 존재하지 않습니다.')
    }
    // console.log('chatSnap', chatSnap)
    let roomInfo = {id: chatSnap.id, ...chatSnap?.data()} as ChatListItem

    // 2. users 컬렉션에서 해당 uid들의 유저 정보 가져오기
    // const uids: string[] = chatSnap?.data()?.members ?? []
    // const usersRef = collection(firestore, 'users')
    // ⚠️ Firestore의 where('uid', 'in', [...])는 최대 10개까지 지원
    // const q = query(usersRef, where('uid', 'in', uids.slice(0, 10))) // 제한 고려

    // const snapshot = await getDocs(q)

    // const members =
    //   snapshot?.docs?.map(
    //     doc =>
    //       ({
    //         id: doc.id,
    //         ...doc.data(),
    //       }) as User,
    //   ) || []
    roomInfo = await setChatMembersInfo(roomInfo)
    return roomInfo || null
  } catch (e) {
    console.log('getChatRoomInfo error', e)
  }
}

//채팅창 메세지 가져오기
export const getChatMessages = async (roomId: string) => {
  try {
    const messagesRef = collection(firestore, 'chats', roomId, 'messages')
    const q = query(messagesRef, orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)

    const messages = snapshot.docs.map(
      doc =>
        ({
          id: doc.id,
          ...doc?.data(),
        }) as ChatMessage,
    )
    return messages ?? null
  } catch (e) {
    console.log('get chat messages error', e)
    return []
  }
}

//채팅 보내기
export const sendMessage = async (
  roomId: string,
  message: ChatMessage,
): Promise<void> => {
  const chatRef = doc(firestore, 'chats', roomId)
  const msgRef = doc(collection(firestore, `chats/${roomId}/messages`)) // 새 메시지 문서 ID 미리 생성

  //runTransaction이란? Firestore의 원자적(atomic) 읽기→계산→쓰기 작업을 한 덩어리로 처리하는 API
  //   무엇을 보장하나요?
  // 원자성: 트랜잭션 내 쓰기는 전부 성공하거나 전부 실패.
  // 일관성/재시도: 다른 클라이언트가 중간에 값을 바꾸면 SDK가 자동으로 다시 읽고 재시도.
  // 경합 안전: 시퀀스 증가, 재고 차감, 포인트 적립 같이 “읽은 값 기반 계산”에 적합.

  // 언제 쓰나요? (vs writeBatch)
  // 트랜잭션: “문서를 읽고 → 그 값으로 계산해서 → 쓴다”가 필요할 때.

  // 배치(writeBatch): “그냥 여러 문서를 한 번에 쓴다”(읽고 계산 X)일 때.

  // 사용 규칙 & 팁

  // 트랜잭션 안에서는 tx.get(docRef)로 ‘문서’만 읽을 수 있음(쿼리 읽기 X).

  // 사이드 이펙트(네트워크 호출/알림 전송 등)는 트랜잭션 밖에서.

  // 실패 시 SDK가 재시도하므로, 순수 계산(idempotent) 로 작성.

  // 한 트랜잭션당 최대 500개 쓰기 권장(일반 배치와 동일 상한).

  // 비용: 읽기/쓰기는 일반과 동일하게 과금되고, 재시도하면 그만큼 읽기/쓰기가 더 발생.
  await runTransaction(firestore, async tx => {
    // 1) 현재 lastSeq 읽고 +1
    const chatSnap = await tx.get(chatRef)
    const prev = (chatSnap.get('lastSeq') as number) ?? 0
    const next = prev + 1
    const now = serverTimestamp()

    // 2) 메시지 문서 작성 (seq 포함)
    const newMessage = {
      seq: next,
      senderId: message.senderId,
      text: message.text ?? '',
      type: message.type,
      imageUrl: message.imageUrl ?? '',
      createdAt: now, // 서버시간
      senderPicURL: message?.senderPicURL ?? null,
      senderName: message?.senderName ?? null,
    }
    tx.set(msgRef, newMessage)

    // 3) 채팅방 문서 갱신 (lastSeq/lastMessage/lastMessageAt)
    //    방 문서가 없을 가능성이 있으면 update 대신 set(..., {merge:true}) 사용
    tx.update(chatRef, {
      lastSeq: next,
      lastMessageAt: now,
      lastMessage: {
        // 리스트 미리보기용 필드만 넣는 걸 권장 (전체 message와 동일하게 둘 수도 있음)
        seq: next,
        text: newMessage.text,
        senderId: newMessage.senderId,
        createdAt: now,
        type: newMessage.type,
        imageUrl: newMessage.imageUrl,
      },
    })
  })
}

//채팅방 생성
export const createChatRoom = async (
  userId: string,
  targetIds: string[],
  options?: {
    name?: string
    image?: string
    type?: ChatListItem['type']
  },
): Promise<string | null> => {
  try {
    const sortedIds = [userId, ...targetIds].sort()
    const chatRef = collection(firestore, 'chats')
    const newRoom: Omit<ChatListItem, 'id'> = {
      type: options?.type ?? (targetIds.length >= 2 ? 'group' : 'dm'),
      createdAt: serverTimestamp(),
      members: sortedIds?.filter(Boolean),
      name: options?.name ?? '',
      image: options?.image ?? '',
      lastMessageAt: serverTimestamp(),
      // lastMessage: message,
    }

    // 1. 채팅방 생성 (자동 ID)
    const docRef = await addDoc(chatRef, removeEmpty(newRoom))
    const roomId = docRef.id

    return roomId
  } catch (e) {
    console.error('create room error', e)
    return null
  }
}

/**
 * 전체 RoomInfo 데이터를 받아 해당 채팅방 문서를 업데이트합니다.
 * @param roomId 채팅방 ID
 * @param roomData RoomInfo 또는 ChatRoom 포맷 객체 (id 필드는 제외됨)
 */
export const updateChatRoom = async (
  roomId: string,
  roomData: Partial<Omit<ChatListItem, 'id'>>,
): Promise<void> => {
  try {
    const chatDocRef = doc(firestore, 'chats', roomId)

    await updateDoc(chatDocRef, roomData)
  } catch (error) {
    console.error('채팅방 정보 업데이트 실패:', error)
    throw error
  }
}

export async function updateLastRead(
  roomId: string,
  userId: string,
  seenSeq: number, // 마지막으로 보인 메시지의 seq (모르면 생략)
) {
  try {
    if (!(roomId && userId && seenSeq)) return
    const chatRef = doc(firestore, 'chats', roomId)
    //현재 채팅방에서 가장 높은 시퀀스 계산하기.
    await runTransaction(firestore, async tx => {
      tx.update(chatRef, {
        [`lastReadSeqs.${userId}`]: seenSeq,
        [`lastReadTimestamps.${userId}`]: serverTimestamp(),
      })
    })
  } catch (e) {
    console.log(e)
  }
}

//마지막 데이터 날짜 이후로 데이터 존재여부 확인
export const getMessagesFromLatestRead = async (
  roomId: string,
  latestCreated: number | ServerTime | null,
) => {
  if (!latestCreated) return []
  const cursor = toRNFTimestamp(latestCreated)
  const messagesRef = collection(firestore, 'chats', roomId, 'messages')
  const q = query(
    messagesRef,
    orderBy('createdAt', 'desc'),
    startAfter(cursor),
    // where('createdAt', '>', Timestamp.fromMillis(latestCreated)),
  )
  const snapshot = await getDocs(q)
  const messages = snapshot?.docs?.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as ChatMessage[]
  return messages ?? []
}
