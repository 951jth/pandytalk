import {inquiryRemote} from '@app/features/admin/data/inquiryRemote.firebase'
import type {FsSnapshot} from '@app/shared/types/firebase'
import type {FirebaseFirestoreTypes} from '@react-native-firebase/firestore'

export interface Inquiry {
  id: string
  source: string
  type: string
  email: string
  message: string
  status: string
  createdAt?: FirebaseFirestoreTypes.Timestamp | null
}

export type GetInquiriesParams = {
  pageSize?: number
  pageParam?: FsSnapshot
}

export const inquiryService = {
  getInquiries: async ({pageSize, pageParam}: GetInquiriesParams = {}) => {
    const {items, nextPageParam, hasNext} = await inquiryRemote.getInquiries({
      pageSize,
      pageParam,
    })
    return {
      inquiries: items as Inquiry[],
      lastVisible: nextPageParam,
      isLastPage: !hasNext,
    }
  },
}
