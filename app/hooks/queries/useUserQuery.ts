import {
  collection,
  endAt,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  startAfter,
  startAt,
} from '@react-native-firebase/firestore'
import {useInfiniteQuery} from '@tanstack/react-query'
import type {User} from '../../types/auth'
import type {FsSnapshot} from '../../types/firebase'

const firestore = getFirestore()
const PAGE_SIZE = 10

export const useUsersInfinite = (searchText: string = '') => {
  return useInfiniteQuery({
    queryKey: ['users', searchText],
    queryFn: async ({pageParam}: {pageParam?: FsSnapshot}) => {
      const usersRef = collection(firestore, 'users')
      // let q = query(usersRef, orderBy('status', 'desc'), limit(PAGE_SIZE));
      let q = null

      if (searchText) {
        q = query(
          usersRef,
          orderBy('nickname', 'asc'),
          orderBy('status', 'desc'),
          orderBy('lastSeen', 'desc'),
          startAt(searchText),
          endAt(searchText + '\uf8ff'),
          limit(PAGE_SIZE),
        )
      } else {
        q = query(
          usersRef,
          orderBy('status', 'desc'),
          orderBy('lastSeen', 'desc'),
          limit(PAGE_SIZE),
        )
      }

      //다음 페이지 요청
      if (pageParam) q = query(q, startAfter(pageParam))

      const snapshot = await getDocs(q)
      const users = snapshot.docs.map(doc => ({
        uid: doc?.id,
        ...doc.data(),
      })) as User[]
      console.log('users', users)
      return {
        users, //데이터
        lastVisible: snapshot.docs[snapshot.docs.length - 1] ?? null, //현재 보고 있는 페이지커서
        isLastPage: snapshot.docs.length < PAGE_SIZE, //마지막 페이지 유무
      }
    },
    //queryFn에서 return 하는 값들
    getNextPageParam: lastPage => {
      return lastPage.isLastPage ? undefined : lastPage.lastVisible
    },
    initialPageParam: undefined,
  })
}
