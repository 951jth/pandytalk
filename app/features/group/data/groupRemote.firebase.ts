import {firebaseCall} from '@app/shared/firebase/firebaseUtils'
import {firestore} from '@app/shared/firebase/firestore'
import {toPageResult} from '@app/shared/firebase/pagination'
import type {FsSnapshot} from '@app/shared/types/firebase'
import type {Group} from '@app/shared/types/group'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
} from '@react-native-firebase/firestore'

const DEFAULT_SIZE = 20

export type GetGroupsPagingParams = {
  pageSize?: number
  pageParam?: FsSnapshot
}

export const groupRemote = {
  getGroupsPaging: ({pageSize, pageParam}: GetGroupsPagingParams) => {
    return firebaseCall('groupRemote.getGroupsPage', async () => {
      const groupRef = collection(firestore, 'groups')
      const constaints = [
        orderBy('createdAt', 'desc'),
        limit(pageSize || DEFAULT_SIZE),
      ]
      if (pageParam) constaints.push(startAfter(pageParam))

      const q = query(groupRef, ...constaints)
      const snapshot = await getDocs(q)
      return toPageResult(
        snapshot.docs,
        pageSize || DEFAULT_SIZE,
        groupDoc => ({
          id: groupDoc.id,
          ...groupDoc.data(),
        }) as Group,
      )
    })
  },
  getGroupInfo: async (groupId: string) => {
    return firebaseCall('groupRemote.getGroupInfo', async () => {
      const groupRef = doc(firestore, 'groups', groupId)
      const snap = await getDoc(groupRef)
      return snap?.data()
      // const data = await getGroupInfo(groupId)
      // return data
    })
  },
}
