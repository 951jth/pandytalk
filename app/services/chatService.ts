import {getApp} from '@react-native-firebase/app'
import {
  addDoc,
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from '@react-native-firebase/firestore'
import {ChatMessage, RoomInfo, User} from '../types/firebase'
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

//채팅방 정보 조회 (멤버 및 채팅방 정보들들)
export const getChatRoomInfo = async (
  roomId: string,
): Promise<RoomInfo | void> => {
  // 1. chats/{roomId} 문서에서 members 배열 가져오기
  try {
    const chatDocRef = doc(firestore, 'chats', roomId)
    const chatSnap = await getDoc(chatDocRef)
    if (!chatSnap.exists()) {
      throw new Error('채팅방이 존재하지 않습니다.')
    }
    let roomInfo = {id: chatSnap.id, ...chatSnap?.data()} as RoomInfo
    const uids: string[] = chatSnap?.data()?.members ?? []

    // 2. users 컬렉션에서 해당 uid들의 유저 정보 가져오기
    const usersRef = collection(firestore, 'users')

    // ⚠️ Firestore의 where('uid', 'in', [...])는 최대 10개까지 지원
    const q = query(usersRef, where('uid', 'in', uids.slice(0, 10))) // 제한 고려

    const snapshot = await getDocs(q)

    const members =
      snapshot?.docs?.map(
        doc =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as User,
      ) || []

    roomInfo.memberInfos = members || null
    return roomInfo || null
  } catch (e) {
    console.error('getChatRoomInfo error', e)
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

/**
 * 실시간 채팅 리스너 설정
 * @param roomId 채팅방 ID
 * @param onMessage 콜백 (새 메시지 수신 시)
 * @returns unsubscribe 함수 (리스너 해제용)
 */
export const subscribeToMessages = (
  roomId: string,
  onMessage: (message: any) => void,
) => {
  const db = getFirestore(getApp())
  const messagesRef = collection(db, 'chats', roomId, 'messages')

  const q = query(messagesRef, orderBy('createdAt', 'desc'))

  const unsubscribe = onSnapshot(q, snapshot => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
    onMessage(messages)
  })

  return unsubscribe
}

//채팅 보내기
export const sendMessage = async (
  roomId: string,
  message: ChatMessage,
): Promise<void> => {
  try {
    const messagesRef = collection(firestore, 'chats', roomId, 'messages')
    const chatRoomRef = doc(firestore, 'chats', roomId)

    const newMessage = {
      senderId: message.senderId,
      text: message.text ?? '',
      type: message.type,
      imageUrl: message.imageUrl ?? '',
      createdAt: Date.now(),
      senderPicURL: message?.senderPicURL,
      senderName: message?.senderName,
    }

    // 1. 메시지 추가
    await addDoc(messagesRef, newMessage)

    // 2. 마지막 메시지 갱신
    await updateDoc(chatRoomRef, {
      lastMessage: newMessage,
    })
  } catch (error) {
    console.error('메시지 전송 실패:', error)
    throw error
  }
}

//채팅방 생성
export const createChatRoom = async (
  userId: string,
  targetIds: string[],
  options?: {
    name?: string
    image?: string
    type?: RoomInfo['type']
  },
): Promise<string | null> => {
  try {
    const sortedIds = [userId, ...targetIds].sort()
    const chatRef = collection(firestore, 'chats')
    const newRoom: Omit<RoomInfo, 'id'> = {
      type: options?.type ?? (targetIds.length >= 2 ? 'group' : 'dm'),
      createdAt: Date.now(),
      members: sortedIds?.filter(Boolean),
      name: options?.name ?? '',
      image: options?.image ?? '',
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
  roomData: Partial<Omit<RoomInfo, 'id'>>,
): Promise<void> => {
  try {
    const chatDocRef = doc(firestore, 'chats', roomId)

    await updateDoc(chatDocRef, roomData)
  } catch (error) {
    console.error('채팅방 정보 업데이트 실패:', error)
    throw error
  }
}

//유저 채팅 마지막 읽음 시간 갱신
export const updateLastRead = async (roomId: string, userId: string) => {
  console.log('updateLastRead')
  try {
    const chatDocRef = doc(firestore, 'chats', roomId)
    await updateDoc(chatDocRef, {
      [`lastReadTimestamps.${userId}`]: Date.now(), // ✅ number(ms)
    })
  } catch (e) {
    console.error('채팅방 정보 업데이트 실패:', e)
  }
}

//안읽은 메세지 수 조회
export const getUnreadCount = async (
  roomId: string,
  userId: string,
  lastRead?: number,
) => {
  const messagesRef = collection(firestore, 'chats', roomId, 'messages')

  const q = query(messagesRef, where('createdAt', '>', lastRead ?? 0))

  const snapshot = await getCountFromServer(q) // ✅ 빠른 count-only 쿼리
  return snapshot.data().count
}
