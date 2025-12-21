import {User} from '@app/shared/types/auth'
import {FsSnapshot} from '@app/shared/types/firebase'
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

const firestore = getFirestore()
const PAGE_SIZE = 10

export const usePendingUsersInfinity = (searchText: string = '') => {
  return useInfiniteQuery({
    queryKey: ['pending-users', searchText],
    queryFn: async ({pageParam}: {pageParam?: FsSnapshot}) => {
      try {
        const usersRef = collection(firestore, 'users')
        // let q = query(usersRef, orderBy('status', 'desc'), limit(PAGE_SIZE));
        let q = null

        if (searchText) {
          q = query(
            usersRef,
            orderBy('displayName', 'asc'),
            orderBy('status', 'desc'),
            orderBy('createdAt', 'desc'),
            startAt(searchText),
            endAt(searchText + '\uf8ff'),
            limit(PAGE_SIZE),
          )
        } else {
          q = query(
            usersRef,
            orderBy('status', 'desc'),
            orderBy('createdAt', 'desc'),
            limit(PAGE_SIZE),
          )
        }

        //다음 페이지 요청
        if (pageParam) q = query(q, startAfter(pageParam))

        const snapshot = await getDocs(q)
        console.log('snapshot', snapshot)
        const users = snapshot.docs.map(doc => ({
          uid: doc?.id,
          ...doc.data(),
        })) as User[]
        return {
          users, //데이터
          lastVisible: snapshot.docs[snapshot.docs.length - 1] ?? null, //현재 보고 있는 페이지커서
          isLastPage: snapshot.docs.length < PAGE_SIZE, //마지막 페이지 유무
        }
      } catch (e) {
        console.log('error', e)
        return {
          users: [], //데이터
          lastVisible: null, //현재 보고 있는 페이지커서
          isLastPage: true, //마지막 페이지 유무
        }
      }
    },
    //queryFn에서 return 하는 값들
    getNextPageParam: lastPage => {
      return lastPage.isLastPage ? undefined : lastPage.lastVisible
    },
    initialPageParam: undefined,
    // onError: (err: any) => {
    //   console.log('error', err)
    //   return {
    //     users: [], //데이터
    //     lastVisible: null, //현재 보고 있는 페이지커서
    //     isLastPage: true, //마지막 페이지 유무
    //   }
    // },
  })
}
