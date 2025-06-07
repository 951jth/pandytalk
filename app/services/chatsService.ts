import { getApp } from "@react-native-firebase/app";
import { collection, getFirestore, query, where } from "@react-native-firebase/firestore";

const firestore = getFirestore(getApp())

//내 채팅방 조회
export const getMyChatRooms = async (userId: String) => {
    try{
        const chatsRef = collection(firestore, 'chats')
        const q = query(
            chatsRef,
             where('members', 'array-contains', userId),
        )
    }
}