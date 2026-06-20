import {firebaseCall} from '@app/shared/firebase/firebaseUtils'
import {firestore} from '@app/shared/firebase/firestore'
import {toPageResult} from '@app/shared/firebase/pagination'
import type {FsSnapshot} from '@app/shared/types/firebase'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  updateDoc,
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
  getInquiry: (id: string) => {
    return firebaseCall('inquiryRemote.getInquiry', async () => {
      const docRef = doc(firestore, 'inquiries', id)
      const snapshot = await getDoc(docRef)
      if (snapshot.exists()) {
        return {id: snapshot.id, ...snapshot.data()}
      }
      return null
    })
  },
  updateInquiryStatus: (id: string, status: string) => {
    return firebaseCall('inquiryRemote.updateInquiryStatus', async () => {
      const docRef = doc(firestore, 'inquiries', id)
      await updateDoc(docRef, {status})
    })
  },
  deleteInquiry: (id: string) => {
    return firebaseCall('inquiryRemote.deleteInquiry', async () => {
      const docRef = doc(firestore, 'inquiries', id)
      await deleteDoc(docRef)

      // 로컬 캐시만 삭제되고 서버에서 거절되는 경우를 방지하기 위해 서버 기준으로 재확인
      const snapshot = await getDocFromServer(docRef)
      if (snapshot.exists()) {
        throw {
          code: 'firestore/permission-denied',
          message: 'Missing or insufficient permissions.',
        }
      }
    })
  },
}
