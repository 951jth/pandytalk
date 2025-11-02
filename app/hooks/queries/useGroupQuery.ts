import {
  collection,
  getDocs,
  limit,
  query,
  startAfter,
  type FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore'
import {useInfiniteQuery, useQuery} from '@tanstack/react-query'
import {orderBy} from 'lodash'
import {getGroupInfo} from '../../services/groupService'
import {firestore} from '../../store/firestore'
import type {FsSnapshot} from '../../types/firebase'
import type {Group} from '../../types/group'

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

const DEFAULT_PAGE_SIZE = 20
const DEFAULT_BATCH_SIZE = 200

type Doc = FirebaseFirestoreTypes.DocumentData
type DocSnap = FirebaseFirestoreTypes.QueryDocumentSnapshot<Doc>
type QuerySnap = FirebaseFirestoreTypes.QuerySnapshot<Doc>

/**
 * groups 컬렉션 무한 스크롤 훅
 * - 기본 정렬: createdAt desc
 * - 보안 규칙에 따라 사용자가 접근 가능한 문서만 내려옴
 */
export function useGroupsInfinity(pageSize: number = DEFAULT_PAGE_SIZE) {
  return useInfiniteQuery({
    queryKey: ['groups', pageSize],
    queryFn: async ({pageParam}: {pageParam?: FsSnapshot}) => {
      try {
        let q = null
        const groupsRef = collection(firestore, 'groups')
        q = query(groupsRef, orderBy('createdAt', 'desc'), limit(pageSize))
        //다음 페이지 요청
        if (pageParam) q = query(q, startAfter(pageParam))

        const snapshot = await getDocs(q)
        const groups = snapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data(),
        })) as Group[]

        return {
          groups: groups || [], //데이터
          lastVisible: null, //현재 보고 있는 페이지커서
          isLastPage: true, //마지막 페이지 유무
        }
      } catch (e) {
        console.log(e)
        return {
          groups: [], //데이터
          lastVisible: null, //현재 보고 있는 페이지커서
          isLastPage: true, //마지막 페이지 유무
        }
      }
    },
    getNextPageParam: lastPage => {
      return lastPage.isLastPage ? undefined : lastPage.lastVisible
    },
    initialPageParam: undefined,
    // 🔽 invalidation/refetch 시 모든 페이지 리패치
  })
}

async function fetchAllGroups(
  batchSize = DEFAULT_BATCH_SIZE,
): Promise<Group[]> {
  const ref = firestore.collection('groups')
  const all: Group[] = []
  let cursor: DocSnap | null = null

  // createdAt desc로 전부 수집
  // eslint-disable-next-line no-constant-condition
  while (true) {
    let q = ref.orderBy('createdAt', 'desc')
    q = cursor ? q.startAfter(cursor).limit(batchSize) : q.limit(batchSize)

    const snap: QuerySnap = await q.get()

    const page: Group[] = snap.docs.map(
      (d): Group => ({
        uid: d.id, // ✅ Group.id 로 매핑
        ...(d.data() as any),
      }),
    )

    all.push(...page)

    if (snap.size < batchSize) break
    cursor = snap.docs[snap.docs.length - 1] ?? null
  }

  return all
}

export function useAllGroups(batchSize = DEFAULT_BATCH_SIZE) {
  return useQuery<Group[], Error>({
    queryKey: ['groups', 'all', batchSize],
    queryFn: () => fetchAllGroups(batchSize),
    staleTime: 30_000,
  })
}
