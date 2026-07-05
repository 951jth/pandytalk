import {groupRemote} from '@app/features/group/data/groupRemote.firebase'
import type {FsSnapshot} from '@app/shared/types/firebase'
import type {Group} from '@app/features/group/types/group'

export const groupService = {
  getAllGroups: async (batchSize: number) => {
    const results: Group[] = []
    let last: FsSnapshot | undefined
    if (batchSize)
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const {items, nextPageParam} = await groupRemote.getGroupsPaging({
          pageSize: batchSize,
          pageParam: last,
        })

        results.push(...(items || []))
        if (items?.length && items.length < batchSize) break
        last = nextPageParam ?? undefined
      }

    return results
  },
  getGroupsPaging: async (pageSize?: number, pageParam?: FsSnapshot) => {
    const {items, nextPageParam, hasNext} = await groupRemote.getGroupsPaging({
      pageSize,
      pageParam,
    })
    return {
      data: items,
      lastVisible: nextPageParam,
      isLastPage: !hasNext,
    }
  },
  getGroupInfo: async (groupId: string) => {
    const data = await groupRemote.getGroupInfo(groupId)
    return data
  },
}
