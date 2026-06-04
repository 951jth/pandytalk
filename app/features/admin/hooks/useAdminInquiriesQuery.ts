import {inquiryService} from '@app/features/admin/service/inquiryService'
import type {FsSnapshot} from '@app/shared/types/firebase'
import {useInfiniteQuery} from '@tanstack/react-query'

export const ADMIN_INQUIRIES_QUERY_KEY = ['adminInquiries']
const DEFAULT_PAGE_SIZE = 20

export const useAdminInquiriesQuery = (
  pageSize: number = DEFAULT_PAGE_SIZE,
) => {
  return useInfiniteQuery({
    queryKey: [...ADMIN_INQUIRIES_QUERY_KEY, pageSize],
    queryFn: async ({pageParam}: {pageParam?: FsSnapshot}) => {
      return inquiryService.getInquiries({pageSize, pageParam})
    },
    getNextPageParam: lastPage =>
      lastPage.isLastPage ? undefined : lastPage.lastVisible,
    initialPageParam: undefined,
  })
}
