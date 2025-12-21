import {ChatListItem} from '@app/shared/types/chat'
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  type FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore'
import {
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import {useEffect, useState} from 'react'
import {useDispatch} from 'react-redux'
import {getChatRoomInfoWithMembers} from '../../../services/chatService'
import {firestore} from '../../../shared/firebase/firestore'
import {useDebouncedCallback} from '../../../shared/hooks/useDebounceCallback'
import {compareChat, getUnreadCount} from '../../../shared/utils/chat'
import {AppDispatch} from '../../../store/store'
import {
  setDMChatCount,
  setGroupChatCount,
} from '../../../store/unreadCountSlice'

interface pageType {
  chats: ChatListItem[]
  lastVisible: unknown | null
  isLastPage: boolean
}

const PAGE_SIZE = 20

//채팅방 구독, 안읽음 메세지도 같이 카운트
/**
 * 리스트 1페이지만 onSnapshot으로 구독.
 * 동시에 collectionGroup('members') 에서 내 멤버십을 한 번에 구독.
 * → unreadCount = max(0, lastSeq - lastReadSeq)
 */
export function useSubscribeChatList(
  uid?: string | null,
  type: ChatListItem['type'] = 'dm',
) {
  const chatsRef = collection(firestore, 'chats')
  const queryClient = useQueryClient()
  const dispatch = useDispatch<AppDispatch>()
  // 🔹 타입별 디스패치 헬퍼
  const dispatchBadge = (t: 'dm' | 'group', count: number) => {
    if (t === 'dm') dispatch(setDMChatCount(count))
    else dispatch(setGroupChatCount(count))
  }

  // 공통: 평탄화 → 정렬 → 페이지 재쪼개기
  const rebuildPages = (
    flat: ChatListItem[],
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

      const patchCache = (
        mutator: (
          flat: ChatListItem[],
          old: InfiniteData<pageType>,
        ) => InfiniteData<pageType>,
      ) => {
        queryClient.setQueriesData<InfiniteData<pageType>>(
          {queryKey: ['chats', type, uid], exact: false},
          old => {
            if (!old) return old
            const flat: ChatListItem[] = old.pages.flatMap(p => p.chats)
            const next = mutator(flat, old)

            // ✅ 합계 계산 & Redux 업데이트
            const nextFlat = next.pages.flatMap(p => p.chats)
            const sum = nextFlat.reduce(
              (acc, c) => acc + (c.unreadCount ?? 0),
              0,
            )
            if (type === 'dm') dispatch(setDMChatCount(sum))
            else dispatch(setGroupChatCount(sum))

            return next
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
            const data = ch.doc.data() as ChatListItem
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
            const data = ch.doc.data() as ChatListItem
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
      where('type', '==', type),
      where('members', 'array-contains', uid),
      orderBy('lastMessageAt', 'desc'),
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
  }, [uid, type])
}

//채팅방 미읽음 카운트 구독 함수, 채팅방 단건 조회임.
export const useSubscribeChatUnreadCount = (
  roomId?: string | undefined | null,
  userId?: string,
) => {
  const [unreadCnt, setUnreadCnt] = useState(0)
  useEffect(() => {
    if (!roomId || !userId) return
    const chatRoomRef = doc(firestore, 'chats', roomId)

    const unsub = onSnapshot(
      chatRoomRef,
      snap => {
        if (!snap.exists()) return
        const chatRoomData = snap.data() as ChatListItem
        console.log(chatRoomData)
        const {lastReadSeqs, lastSeq} = chatRoomData
        const userReadSeq = lastReadSeqs?.[userId] ?? 0
        const userUnreadSeq = (lastSeq || 0) - userReadSeq
        setUnreadCnt(userUnreadSeq > 0 ? userUnreadSeq : 0)
      },
      error => {
        console.error('[chat head snapshot] error:', error)
        // 필요 시: invalidate({ type: 'full' })
      },
    )

    return () => unsub()
  }, [roomId, userId])
  return {unreadCnt}
}

export function useChatRoomInfo(roomId: string | null) {
  return useQuery({
    queryKey: ['chatRoom', roomId],
    enabled: !!roomId,
    queryFn: async () => {
      try {
        if (!roomId) return null
        const roomInfo = await getChatRoomInfoWithMembers(roomId)
        return roomInfo ?? null
      } catch (e) {
        console.log(e)
        return null
      }
    },
  })
}
