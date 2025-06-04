import {getApp} from '@react-native-firebase/app'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  where,
} from '@react-native-firebase/firestore'
import {RoomInfo, User} from '../types/firebase'

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
): Promise<RoomInfo | null> => {
  try {
    // 1. chats/{roomId} 문서에서 members 배열 가져오기
    const chatDocRef = doc(firestore, 'chats', roomId)
    const chatSnap = await getDoc(chatDocRef)
    if (!chatSnap.exists()) {
      throw new Error('채팅방이 존재하지 않습니다.')
    }
    let roomInfo = chatSnap?.data() as RoomInfo
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
    if (!roomInfo) return null
    roomInfo.members = members
    return roomInfo
  } catch (e) {
    console.log(e)
    return null
  }
}

//채팅창 메세지 가져오기
export const getChatMessages = async (roomId: string) => {
  try {
    const messagesRef = collection(firestore, 'chats', roomId, 'messages')
    const q = query(messagesRef, orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)

    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc?.data(),
    }))
    return messages
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

export const sendMessage = async (
  text: string,
  roomId: string,
  senderUid: string,
) => {}
