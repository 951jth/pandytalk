import {
  collection,
  FirebaseFirestoreTypes,
  getFirestore,
  query,
} from '@react-native-firebase/firestore'
import {useInfiniteQuery} from '@tanstack/react-query'

const firestore = getFirestore()
const PAGE_SIZE = 10

export const useUsersInfinite = () => {
  return useInfiniteQuery({
    queryKey: ['users'],
    queryFn: async ({
      pageParam,
    }: {
      pageParam?: FirebaseFirestoreTypes.QueryDocumentSnapshot<FirebaseFirestoreTypes.DocumentData>
    }) => {
      const usersRef = collection(firestore, 'users')
      let q = query(usersRef)
    },
    getNextPageParam: lastPage => {
      //   return lastPage.isLastPage ? undefined : lastPage.lastVisible
    },
    initialPageParam: undefined,
  })
}
