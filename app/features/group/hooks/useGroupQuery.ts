import {groupService} from '@app/features/group/service/groupService'
import type {Group} from '@app/shared/types/group'
import {useInfiniteQuery, useQuery} from '@tanstack/react-query'
import {getGroupInfo} from '../../../services/groupService'

const DEFAULT_PAGE_SIZE = 20
const DEFAULT_BATCH_SIZE = 200

export const useGroup = (groupId?: string | null) => {
  return useQuery({
    queryKey: ['group', groupId],
    enabled: !!groupId,
    queryFn: async () => {
      try {
        const data = groupId ? await getGroupInfo(groupId) : {}
        return data || {}
      } catch (e) {
        console.log(e)
        return {name: null, memo: null}
      }
    },

    // staleTime: 60_000,                       // 1분 동안 fresh
    // gcTime: 5 * 60_000,                      // v5: 캐시 정리 시간(기존 cacheTime)
  })
}

export function useGroupsInfinity(pageSize: number = DEFAULT_PAGE_SIZE) {
  return useInfiniteQuery({
    queryKey: ['groups', pageSize],
    queryFn: async ({pageParam}: {pageParam?: any}) => {
      try {
        const {data, lastVisible, isLastPage} =
          await groupService.getGroupsPaging(pageSize, pageParam)

        return {
          data, //데이터
          lastVisible, //현재 보고 있는 페이지커서
          isLastPage, //마지막 페이지 유무
        }
      } catch (e) {
        console.log(e)
        return {
          data: [], //데이터
          lastVisible: null, //현재 보고 있는 페이지커서
          isLastPage: true, //마지막 페이지 유무
        }
      }
    },
    getNextPageParam: lastPage => {
      return lastPage.isLastPage ? undefined : lastPage.lastVisible
    },
    initialPageParam: undefined,
  })
}

export function useAllGroups(batchSize: number = DEFAULT_BATCH_SIZE) {
  return useQuery<Group[], Error>({
    queryKey: ['groups', 'all', batchSize],
    queryFn: async () => {
      const results = await groupService.getAllGroups(batchSize)
      return results
    },
    staleTime: 30_000,
  })
}
