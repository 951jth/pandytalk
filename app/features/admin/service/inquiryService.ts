import {inquiryRemote} from '@app/features/admin/data/inquiryRemote.firebase'

export interface Inquiry {
  id: string
  source: string
  type: string
  email: string
  message: string
  status: string
  createdAt: any
}

export const inquiryService = {
  getInquiries: async (): Promise<Inquiry[]> => {
    const data = await inquiryRemote.getInquiries()
    return data as Inquiry[]
  },
}
