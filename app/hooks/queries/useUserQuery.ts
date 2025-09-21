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
  where,
} from '@react-native-firebase/firestore'
import {useInfiniteQuery} from '@tanstack/react-query'
import {useAppSelector} from '../../store/reduxHooks'
import type {User} from '../../types/auth'
import type {FsSnapshot} from '../../types/firebase'

const firestore = getFirestore()
const PAGE_SIZE = 10

export const useUsersInfinite = (searchText: string = '') => {
  const {data: userInfo} = useAppSelector(state => state.user)

  return useInfiniteQuery({
    queryKey: ['users', searchText, userInfo?.groupId ?? null],
    queryFn: async ({pageParam}: {pageParam?: FsSnapshot}) => {
      const usersRef = collection(firestore, 'users')

      // 공통 제약 조건 빌드
      const cons = [where('isConfirmed', '==', true)]

      // ✅ admin이 아니면 해당 groupId로 제한
      if (userInfo?.groupId && userInfo.groupId !== 'admin') {
        cons.push(where('groupId', '==', userInfo.groupId))
      }

      if (searchText) {
        cons.push(
          orderBy('displayName', 'asc'),
          orderBy('status', 'desc'),
          orderBy('lastSeen', 'desc'),
          startAt(searchText),
          endAt(searchText + '\uf8ff'),
          limit(PAGE_SIZE),
        )
      } else {
        cons.push(
          orderBy('status', 'desc'),
          orderBy('lastSeen', 'desc'),
          limit(PAGE_SIZE),
        )
      }

      let q = query(usersRef, ...cons)

      // 다음 페이지
      if (pageParam) q = query(q, startAfter(pageParam))

      const snapshot = await getDocs(q)
      const users = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
      })) as User[]

      return {
        users,
        lastVisible: snapshot.docs[snapshot.docs.length - 1] ?? null,
        isLastPage: snapshot.docs.length < PAGE_SIZE,
      }
    },
    getNextPageParam: lastPage =>
      lastPage.isLastPage ? undefined : lastPage.lastVisible,
    initialPageParam: undefined,
  })
}

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
