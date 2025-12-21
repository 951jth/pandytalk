import type {ChatListItem} from '@app/shared/types/chat'
import {doc, updateDoc} from '@react-native-firebase/firestore'
import {firestore} from '../shared/firebase/firestore'

export default {
  updateChatRoom: async (
    roomId: string,
    roomData: Partial<Omit<ChatListItem, 'id'>>,
  ) => {
    try {
      const chatDocRef = doc(firestore, 'chats', roomId)
      await updateDoc(chatDocRef, roomData)
    } catch (e) {}
  },
}
