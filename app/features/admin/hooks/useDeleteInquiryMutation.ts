import {inquiryService} from '@app/features/admin/service/inquiryService'
import {useMutation, useQueryClient} from '@tanstack/react-query'
import {ADMIN_INQUIRIES_QUERY_KEY} from './useAdminInquiriesQuery'
import {ADMIN_INQUIRY_QUERY_KEY} from './useAdminInquiryQuery'

export function useDeleteInquiryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => inquiryService.deleteInquiry(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({queryKey: ADMIN_INQUIRIES_QUERY_KEY})
      queryClient.removeQueries({queryKey: [...ADMIN_INQUIRY_QUERY_KEY, id]})
    },
  })
}
