import {firebaseCall} from '@app/shared/firebase/firebaseUtils'
import {firestore} from '@app/shared/firebase/firestore'
import {toPageResult} from '@app/shared/firebase/pagination'
import type {Group} from '@app/shared/types/group'
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
} from '@react-native-firebase/firestore'

const DEFAULT_SIZE = 20

export type GetGroupsPagingParams = {
  pageSize?: number
  pageParam?: any // React Query의 pageParam (보통 DocumentSnapshot)
}

export const groupRemote = {
  getGroupsPaging: ({pageSize, pageParam}: GetGroupsPagingParams) => {
    return firebaseCall('groupRemote.getGroupsPage', async () => {
      const groupRef = collection(firestore, 'groups')
      let constaints = [
        orderBy('createdAt', 'desc'),
        limit(pageSize || DEFAULT_SIZE),
      ]
      if (pageParam) constaints.push(startAfter(pageParam))

      const q = query(groupRef, ...constaints)
      const snapshot = await getDocs(q)
      return toPageResult<Group>(
        snapshot.docs,
        pageSize || DEFAULT_SIZE,
        doc => ({
          id: doc.id,
          ...doc.data(),
        }),
      )
    })
  },
}
