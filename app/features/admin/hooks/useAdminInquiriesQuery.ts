import {inquiryService} from '@app/features/admin/service/inquiryService'
import {useQuery} from '@tanstack/react-query'

export const ADMIN_INQUIRIES_QUERY_KEY = ['adminInquiries']

export const useAdminInquiriesQuery = () => {
  return useQuery({
    queryKey: ADMIN_INQUIRIES_QUERY_KEY,
    queryFn: async () => {
      const data = await inquiryService.getInquiries()
      return data
    },
  })
}
