import {userService} from '@app/features/user/service/userService'
import type {FsSnapshot} from '@app/shared/types/firebase'
import {useAppSelector} from '@app/store/reduxHooks'
import {useInfiniteQuery} from '@tanstack/react-query'

export function useUsersInfinite(searchText: string) {
  const {data: userInfo} = useAppSelector(state => state.user)
  const groupId = userInfo?.groupId ?? null
  const authority = userInfo?.authority ?? 'USER'
  const isConfirmed = true
  const pageSize = 20
  return useInfiniteQuery({
    queryKey: [
      'users',
      searchText,
      userInfo?.groupId ?? null,
      userInfo?.authority ?? null, // 권한 변경 시 캐시 분기
    ],
    enabled: !!userInfo, // 프로필 준비 후 실행,
    queryFn: async ({pageParam}: {pageParam?: FsSnapshot}) => {
      const {users, lastVisible, isLastPage} = await userService.getUsers({
        groupId,
        authority,
        searchText,
        pageSize,
        pageParam,
        isConfirmed,
      })
      return {users, lastVisible, isLastPage}
    },
    getNextPageParam: lastPage =>
      lastPage.isLastPage ? undefined : lastPage.lastVisible,
    initialPageParam: undefined,
  })
}
