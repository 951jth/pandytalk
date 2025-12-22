import {chatService} from '@app/features/chat/service/chatService'
import {useDebouncedCallback} from '@app/shared/hooks/useDebounceCallback'
import {ChatListItem} from '@app/shared/types/chat'
import {compareChat, getUnreadCount} from '@app/shared/utils/chat'
import {AppDispatch} from '@app/store/store'
import {setDMChatCount, setGroupChatCount} from '@app/store/unreadCountSlice'
import {FirebaseFirestoreTypes} from '@react-native-firebase/firestore'
import {InfiniteData, useQueryClient} from '@tanstack/react-query'
import {useEffect} from 'react'
import {useDispatch} from 'react-redux'

interface pageType {
  chats: ChatListItem[]
  lastVisible: unknown | null
  isLastPage: boolean
}

const PAGE_SIZE = 20

export function useSubscribeChatList(
  uid?: string | null,
  type: ChatListItem['type'] = 'dm',
) {
  const dispatch = useDispatch<AppDispatch>()
  const queryClient = useQueryClient()
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
              unreadCount: getUnreadCount(data, uid),
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
    let isInitial = true
    const unsub = chatService.subscribeMyChats(
      {
        uid,
        type,
        pageSize: PAGE_SIZE,
      },
      changes => {
        if (isInitial) {
          isInitial = false
          return // 초기 발행은 refetch 생략
        }
        console.log(changes)
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
    )

    return () => unsub()
  }, [uid, type])
}
