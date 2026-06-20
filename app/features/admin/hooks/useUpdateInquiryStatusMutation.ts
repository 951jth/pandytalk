import {useMutation, useQueryClient} from '@tanstack/react-query'
import {inquiryService} from '@app/features/admin/service/inquiryService'
import {ADMIN_INQUIRIES_QUERY_KEY} from './useAdminInquiriesQuery'
import {ADMIN_INQUIRY_QUERY_KEY} from './useAdminInquiryQuery'

export function useUpdateInquiryStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({id, status}: {id: string; status: string}) =>
      inquiryService.updateInquiryStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({queryKey: ADMIN_INQUIRIES_QUERY_KEY})
      queryClient.invalidateQueries({
        queryKey: [...ADMIN_INQUIRY_QUERY_KEY, variables.id],
      })
    },
  })
}
