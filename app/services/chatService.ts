import {getApp} from '@react-native-firebase/app'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  updateDoc,
  where,
} from '@react-native-firebase/firestore'
// import {FieldValue} from 'firebase-admin/firestore'
import {User} from '@app/shared/types/auth'
import type {ChatItemWithMemberInfo, ChatListItem} from '@shared/types/chat'

const firestore = getFirestore(getApp())

//타입별 멤버 조회 호출 함수,(dm, group) : 과거
//멤버 정보가 바뀌게 될 수 있어서, id로 별도로 조회해야함.
const setChatMembersInfo = async (roomInfo: ChatListItem) => {
  try {
    //현재는 그룹의 멤버가 변경되면 클라우드펑션에서 자동으로 채팅멤버 세팅해줘서 사용 switch 문 사용하지않음
    let uids = roomInfo?.members ?? []
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
    return roomInfo as ChatItemWithMemberInfo
  } catch (e) {
    console.log(e)
    return roomInfo as ChatItemWithMemberInfo
  }
}

//채팅방 정보 조회 (멤버 및 채팅방 정보들들)
export const getChatRoomInfoWithMembers = async (
  roomId: string,
): Promise<ChatItemWithMemberInfo | null> => {
  // 1. chats/{roomId} 문서에서 members 배열 가져오기
  try {
    if (!roomId) return null
    const chatDocRef = doc(firestore, 'chats', roomId)
    const chatSnap = await getDoc(chatDocRef)
    if (!chatSnap.exists()) {
      throw new Error('채팅방이 존재하지 않습니다.')
    }
    let roomInfo = {id: chatSnap.id, ...chatSnap?.data()} as ChatListItem
    const roomInfoWithMembers = await setChatMembersInfo(roomInfo)
    return roomInfoWithMembers || null
  } catch (e) {
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
