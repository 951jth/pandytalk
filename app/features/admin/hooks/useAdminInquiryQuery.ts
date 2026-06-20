import {inquiryService} from '@app/features/admin/service/inquiryService'
import {useQuery} from '@tanstack/react-query'

export const ADMIN_INQUIRY_QUERY_KEY = ['adminInquiry']

export const useAdminInquiryQuery = (inquiryId?: string) => {
  return useQuery({
    queryKey: [...ADMIN_INQUIRY_QUERY_KEY, inquiryId],
    queryFn: () => inquiryService.getInquiry(inquiryId as string),
    enabled: Boolean(inquiryId),
  })
}
