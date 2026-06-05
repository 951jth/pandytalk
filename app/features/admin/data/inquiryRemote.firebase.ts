import {firebaseCall} from '@app/shared/firebase/firebaseUtils'
import {firestore} from '@app/shared/firebase/firestore'
import {toPageResult} from '@app/shared/firebase/pagination'
import type {FsSnapshot} from '@app/shared/types/firebase'
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
} from '@react-native-firebase/firestore'

const DEFAULT_PAGE_SIZE = 20

export type GetInquiriesParams = {
  pageSize?: number
  pageParam?: FsSnapshot
}

export const inquiryRemote = {
  getInquiries: ({
    pageSize = DEFAULT_PAGE_SIZE,
    pageParam,
  }: GetInquiriesParams = {}) => {
    return firebaseCall('inquiryRemote.getInquiries', async () => {
      const constraints = [orderBy('createdAt', 'desc'), limit(pageSize + 1)]
      if (pageParam) constraints.push(startAfter(pageParam))

      const q = query(collection(firestore, 'inquiries'), ...constraints)
      const snapshot = await getDocs(q)
      return toPageResult(snapshot.docs, pageSize, doc => ({
        id: doc.id,
        ...doc.data(),
      }))
    })
  },
  updateInquiryStatus: (id: string, status: string) => {
    return firebaseCall('inquiryRemote.updateInquiryStatus', async () => {
      const {doc, updateDoc} = await import('@react-native-firebase/firestore')
      const docRef = doc(firestore, 'inquiries', id)
      await updateDoc(docRef, {status})
    })
  },
}
