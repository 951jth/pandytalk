import {doc, updateDoc} from '@react-native-firebase/firestore'
import {firestore} from '../shared/firebase/firestore'
import type {ChatListItem} from '../types/chat'

export default {
  updateChatRoom: async (
    roomId: string,
    roomData: Partial<Omit<ChatListItem, 'id'>>,
  ) => {
    try {
      const chatDocRef = doc(firestore, 'chats', roomId)
      await updateDoc(chatDocRef, roomData)
    } catch (e) {
      console.log(e)
    }
  },
}
