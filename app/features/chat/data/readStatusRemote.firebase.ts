import {firebaseCall} from '@app/shared/firebase/firebaseUtils'
import {firestore} from '@app/shared/firebase/firestore'
import {doc, serverTimestamp, updateDoc} from '@react-native-firebase/firestore'

export const readStatusRemote = {
  updateChatLastReadByUser: (
    roomId: string,
    userId: string,
    lastReadSeq: number,
  ) => {
    return firebaseCall(
      'readStatusRemote.updateChatLastReadByUser',
      async () => {
        if (!roomId || !userId) return
        const chatRef = doc(firestore, 'chats', roomId)
        const params = {
          [`lastReadSeqs.${userId}`]: lastReadSeq,
          [`lastReadTimestamps.${userId}`]: serverTimestamp(),
        }
        const snap = await updateDoc(chatRef, params)
      },
    )
  },
}
