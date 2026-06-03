import {firebaseCall} from '@app/shared/firebase/firebaseUtils'
import {firestore} from '@app/shared/firebase/firestore'
import {
  collection,
  getDocs,
  orderBy,
  query,
} from '@react-native-firebase/firestore'

export const inquiryRemote = {
  getInquiries: () => {
    return firebaseCall('inquiryRemote.getInquiries', async () => {
      const q = query(
        collection(firestore, 'inquiries'),
        orderBy('createdAt', 'desc'),
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
    })
  },
}
