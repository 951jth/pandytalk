import {ChatRoom} from '@app/shared/types/chat'
import {FsSnapshot} from '@app/shared/types/firebase'
import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  where,
  type FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore'
import {
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import {useEffect} from 'react'
import {firestore} from '../../../shared/firebase/firestore'
import {useDebouncedCallback} from '../../../shared/hooks/useDebounceCallback'
import {compareChat, getUnreadCount} from '../../../shared/utils/chat'

interface pageType {
  chats: ChatRoom[]
  lastVisible: unknown | null
  isLastPage: boolean
}

const PAGE_SIZE = 20

//내 채팅방 조회
export const useGroupChatsInfinite = (userId: string | null | undefined) => {
  return useInfiniteQuery({
    enabled: !!userId,
    queryKey: ['chats', 'group'],
    initialPageParam: undefined as FsSnapshot | undefined,
    queryFn: async ({pageParam}) => {
      if (!userId) {
        return {
          chats: [] as ChatRoom[],
          lastVisible: null,
          isLastPage: true,
        }
      }

      const chatsRef = collection(firestore, 'chats')
      // 최신 메시지 기준 정렬 + 생성일 보조 정렬 (기존과 동일)
      let q = query(
        chatsRef,
        where('type', '==', 'group'),
        orderBy('lastMessage.createdAt', 'desc'),
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE),
      )

      if (pageParam) {
        // 여러 orderBy가 있어도 snapshot 커서 하나로 OK
        q = query(q, startAfter(pageParam))
      }

      const snapshot = await getDocs(q)

      const chats: ChatRoom[] = snapshot.docs.map(d => {
        const data = d.data() as any
        const unreadCount = getUnreadCount(data, userId)

        return {
          id: d.id,
          type: data.type,
          createdAt: data.createdAt,
          lastMessage: data.lastMessage,
          lastSeq: data?.lastSeq ?? 0,
          members: data.members ?? [],
          lastReadSeqs: data.lastReadSeqs ?? undefined,
          lastReadTimestamps: data.lastReadTimestamps ?? undefined,
          unreadCount,
        }
      })

      return {
        chats,
        lastVisible: snapshot.docs[snapshot.docs.length - 1] ?? null,
        isLastPage: snapshot.docs.length < PAGE_SIZE,
      }
    },
    getNextPageParam: lastPage =>
      lastPage?.isLastPage
        ? undefined
        : (lastPage?.lastVisible as FsSnapshot | undefined),
  })
}

//채팅방 구독, 안읽음 메세지도 같이 카운트
/**
 * 리스트 1페이지만 onSnapshot으로 구독.
 * 동시에 collectionGroup('members') 에서 내 멤버십을 한 번에 구독.
 * → unreadCount = max(0, lastSeq - lastReadSeq)
 */
export function useSubscribeGroupChatList(uid?: string | null) {
  const chatsRef = collection(firestore, 'chats')
  const queryClient = useQueryClient()

  // 공통: 평탄화 → 정렬 → 페이지 재쪼개기
  const rebuildPages = (
    flat: ChatRoom[],
    old: InfiniteData<pageType>,
  ): InfiniteData<pageType> => {
    flat.sort(compareChat)
    const newPages: pageType[] = []
    for (let i = 0; i < flat.length; i += PAGE_SIZE) {
      const slice = flat.slice(i, i + PAGE_SIZE)
      newPages.push({
        chats: slice,
        lastVisible:
          old.pages[Math.min(newPages.length, old.pages.length - 1)]
            ?.lastVisible ?? null,
        isLastPage: i + PAGE_SIZE >= flat.length,
      })
    }
    return {...old, pages: newPages.length ? newPages : old.pages}
  }

  /**
   * ✅ invalidate(action) 설계
   * - {type:'full'}                         : 전체 refetch (원하면 사용)
   * - {type:'patch', changes}               : modified만 캐시 패치
   * - {type:'add', docs}                    : added 문서 캐시 삽입
   * - {type:'remove', ids}                  : removed 문서 캐시 제거
   */
  const invalidate = useDebouncedCallback(
    (
      action:
        | {type: 'full'}
        | {
            type: 'patch'
            changes: FirebaseFirestoreTypes.DocumentChange[]
          }
        | {
            type: 'add'
            docs: FirebaseFirestoreTypes.DocumentChange[]
          }
        | {
            type: 'remove'
            ids: string[]
          },
    ) => {
      if (!uid) return
      if (action.type === 'full') {
        // 필요 시 전체 재조회(프로젝트 정책에 맞게 선택)
        // refetch?.()
        // queryClient.invalidateQueries({ queryKey: ['chats','dm',uid], refetchType: 'active' as any })
        return
      }

      // 공통 캐시 갱신 함수
      // React Query 캐시(무한쿼리)를 “즉시 수정”하기 위한 공용 래퍼
      const patchCache = (
        mutator: (
          flat: ChatRoom[],
          old: InfiniteData<pageType>,
        ) => InfiniteData<pageType>,
      ) => {
        // flat은 리스트 조작(추가·삭제·정렬)을 한 번에 처리한 값 (1차원 배열)
        // old는 페이지 메타데이터(lastVisible, isLastPage, 그리고 필요 시 pageParams)를 참고하거나,
        // 결과를 다시 InfiniteData 구조로 되돌리기 위해 필요합니다.
        queryClient.setQueriesData<InfiniteData<pageType>>(
          {queryKey: ['chats', 'dm', uid], exact: false},
          old => {
            if (!old) return old
            const flat: ChatRoom[] = old.pages.flatMap(p => p.chats)
            return mutator(flat, old)
          },
        )
      }

      if (action.type === 'patch') {
        const modified = action.changes.filter(c => c.type === 'modified')
        if (modified.length === 0) return
        patchCache((flat, old) => {
          for (const ch of modified) {
            const id = ch.doc.id
            const idx = flat.findIndex(x => x.id === id)
            const data = ch.doc.data() as ChatRoom
            const fetchData = {
              ...data,
              unreadCount: getUnreadCount(data, uid),
            }
            if (idx >= 0) flat[idx] = {...flat[idx], ...fetchData, id}
            else flat.push({...fetchData, id}) // 안전장치
          }
          return rebuildPages(flat, old)
        })
        return
      }

      if (action.type === 'add') {
        if (!action.docs?.length) return
        patchCache((flat, old) => {
          for (const ch of action.docs) {
            const id = ch.doc.id
            if (flat.some(x => x.id === id)) continue
            const data = ch.doc.data() as ChatRoom
            const fetchData = {
              ...data,
              unrunreadCount: getUnreadCount(data, uid),
            }
            flat.push({...fetchData, id})
          }
          return rebuildPages(flat, old)
        })
        return
      }

      if (action.type === 'remove') {
        if (!action.ids?.length) return
        patchCache((flat, old) => {
          const next = flat.filter(x => !action.ids.includes(x.id))
          return rebuildPages(next, old)
        })
        return
      }
    },
    200,
  )

  useEffect(() => {
    if (!uid) return

    const q = query(
      chatsRef,
      where('type', '==', 'dm'),
      where('members', 'array-contains', uid),
      orderBy('lastMessage.createdAt', 'desc'),
      orderBy('createdAt', 'desc'),
      limit(PAGE_SIZE),
    )

    let isInitial = true
    const unsub = onSnapshot(
      q,
      snap => {
        if (isInitial) {
          isInitial = false
          return // 초기 발행은 refetch 생략
        }
        const changes = snap.docChanges()
        if (changes.length === 0) return

        const added = changes.filter(c => c.type === 'added')
        const removed = changes.filter(c => c.type === 'removed')
        const modified = changes.filter(c => c.type === 'modified')
        // ➕ 추가 즉시 반영
        if (added.length) {
          invalidate({type: 'add', docs: added})
        }
        // ➖ 제거 즉시 반영
        if (removed.length) {
          invalidate({type: 'remove', ids: removed.map(r => r.doc.id)})
        }
        // 🔧 수정 즉시 반영
        if (modified.length) {
          invalidate({type: 'patch', changes: modified})
        }
      },
      error => {
        console.error('[chat head snapshot] error:', error)
        // 필요 시: invalidate({ type: 'full' })
      },
    )

    return () => unsub()
  }, [uid])
}
