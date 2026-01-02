import {groupRemote} from '@app/features/group/data/groupRemote.firebase'
import {firebaseCall} from '@app/shared/firebase/firebaseUtils'

export const groupService = {
  getAllGroups: async (batchSize: number) => {
    return firebaseCall('groupService.getAllGroups', async () => {
      const results: any[] = []
      let last: any = null
      if (batchSize)
        while (true) {
          const {items} = await groupRemote.getGroupsPaging({
            pageSize: batchSize,
            pageParam: last,
          })

          results.push(...(items || []))
          if (items?.length && items.length < batchSize) break
          last = items?.[items.length - 1]?.uid
        }

      return results
    })
  },
  getGroupsPaging: async (pageSize?: number, pageParam?: any) => {
    return firebaseCall('groupService.getGroupsPaging', async () => {
      const {items, nextPageParam, hasNext} = await groupRemote.getGroupsPaging(
        {pageSize, pageParam},
      )
      return {
        data: items,
        lastVisible: nextPageParam,
        isLastPage: !hasNext,
      }
    })
  },
  getGroupInfo: async (groupId: string) => {
    return firebaseCall('groupService.getGroupInfo', async () => {
      const data = await groupRemote.getGroupInfo(groupId)
      return data
    })
  },
}
