import {useMutation, useQueryClient} from '@tanstack/react-query'
import {inquiryService} from '@app/features/admin/service/inquiryService'

export function useUpdateInquiryStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({id, status}: {id: string; status: string}) =>
      inquiryService.updateInquiryStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['adminInquiries']})
    },
  })
}
