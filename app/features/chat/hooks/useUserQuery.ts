import {User} from '@app/shared/types/auth'
import {FsSnapshot} from '@app/shared/types/firebase'
import {
  collection,
  endAt,
  getDocs,
  getFirestore,
  limit,
  or,
  orderBy,
  query,
  startAfter,
  startAt,
  where,
} from '@react-native-firebase/firestore'
import {useInfiniteQuery} from '@tanstack/react-query'
import {useAppSelector} from '../../../store/reduxHooks'

const firestore = getFirestore()
const PAGE_SIZE = 10

export const useUsersInfinite = (searchText: string = '') => {
  const {data: userInfo} = useAppSelector(state => state.user)
  return useInfiniteQuery({
    queryKey: [
      'users',
      searchText,
      userInfo?.groupId ?? null,
      userInfo?.authority ?? null, // 권한 변경 시 캐시 분기
    ],
    enabled: !!userInfo, // 프로필 준비 후 실행
    queryFn: async ({pageParam}: {pageParam?: FsSnapshot}) => {
      try {
        const usersRef = collection(firestore, 'users')

        // 1) 기본 필터
        const filters: any[] = [where('isConfirmed', '==', true)]

        // 2) 비관리자면: (내 그룹) OR (ADMIN) 만
        if (userInfo?.authority !== 'ADMIN') {
          filters.push(
            or(
              where('authority', '==', 'ADMIN'),
              where('groupId', '==', userInfo?.groupId ?? '__NONE__'),
            ),
          )
        }
        // ADMIN은 제한 없음(전체 조회)
        // 3) 베이스 쿼리
        let q = query(usersRef, ...filters)

        // 3) 검색/정렬
        if (searchText) {
          q = query(
            q,
            orderBy('displayName', 'asc'),
            orderBy('status', 'desc'),
            orderBy('lastSeen', 'desc'),
            startAt(searchText),
            endAt(searchText + '\uf8ff'),
            limit(PAGE_SIZE),
          )
        } else {
          q = query(
            q,
            orderBy('status', 'desc'),
            orderBy('lastSeen', 'desc'),
            limit(PAGE_SIZE),
          )
        }

        // 4) 페이지네이션
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
      } catch (e) {
        console.log(e)
        return {
          users: [],
          lastVisible: null,
          isLastPage: true,
        }
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
