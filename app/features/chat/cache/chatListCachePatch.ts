import {ChatListItem} from '@app/shared/types/chat'
import {compareChat, getUnreadCount} from '@app/shared/utils/chat'
import {FirebaseFirestoreTypes} from '@react-native-firebase/firestore'
import {InfiniteData} from '@tanstack/react-query'

type pageType = {
  chats: ChatListItem[]
  lastVisible: unknown | null
  isLastPage: boolean
}

export const rebuildPages = (
  flat: ChatListItem[],
  old: InfiniteData<pageType>,
  pageSize: number,
): InfiniteData<pageType> => {
  const PAGE_SIZE = pageSize || 20
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

// export const patchChatItemCache = (
//     flat: ChatListItem[],
//     old: InfiniteData<pageType>,
// ) => {
//       if (!old) return old
//       const flat: ChatListItem[] = old.pages.flatMap(p => p.chats)
//       const next = mutator(flat, old)

//       // ✅ 합계 계산 & Redux 업데이트
//       const nextFlat = next.pages.flatMap(p => p.chats)
//       const sum = nextFlat.reduce((acc, c) => acc + (c.unreadCount ?? 0), 0)
//       if (type === 'dm') dispatch(setDMChatCount(sum))
//       else dispatch(setGroupChatCount(sum))

//       return next
// }
// type DocChange = FirebaseFirestoreTypes.DocumentChange

// export type PatchCacheAction =
//   | {type: 'full'}
//   | {type: 'patch'; changes: DocChange[]}
//   | {type: 'add'; changes: DocChange[]}
//   | {type: 'remove'; ids: string[]}

export type PatchCacheAction =
  | {type: 'full'}
  | {type: 'upsert'; chats: ChatListItem[]} // added + modified 통합
  | {type: 'remove'; ids: string[]}

//mutator -> action 방식으로 교체
export const getChatDataWithCount = (
  uid: string,
  docs: FirebaseFirestoreTypes.DocumentChange[],
) => {
  const chats: ChatListItem[] = []
  docs?.forEach(chat => {
    const data = chat?.doc?.data() as ChatListItem
    const dataWithUnreadCount = {
      ...data,
      unreadCount: getUnreadCount(data, uid),
    }
    chats.push(dataWithUnreadCount)
  })
  return chats
}

export const patchCacheAction = (action: PatchCacheAction) => {
  switch (action.type) {
    case 'upsert':
      break

    default:
      break
  }
}

// const invalidate = useDebouncedCallback(
//   (
//     action:
//       | {type: 'full'}
//       | {
//           type: 'patch'
//           changes: FirebaseFirestoreTypes.DocumentChange[]
//         }
//       | {
//           type: 'add'
//           docs: FirebaseFirestoreTypes.DocumentChange[]
//         }
//       | {
//           type: 'remove'
//           ids: string[]
//         },
//   ) => {
//     if (!uid) return
//     if (action.type === 'full') {
//       // 필요 시 전체 재조회(프로젝트 정책에 맞게 선택)
//       // refetch?.()
//       // queryClient.invalidateQueries({ queryKey: ['chats','dm',uid], refetchType: 'active' as any })
//       return
//     }

//     const patchCache = (
//       mutator: (
//         flat: ChatListItem[],
//         old: InfiniteData<pageType>,
//       ) => InfiniteData<pageType>,
//     ) => {
//       queryClient.setQueriesData<InfiniteData<pageType>>(
//         {queryKey: ['chats', type, uid], exact: false},
//         old => {
//           if (!old) return old
//           const flat: ChatListItem[] = old.pages.flatMap(p => p.chats)
//           const next = mutator(flat, old)

//           // ✅ 합계 계산 & Redux 업데이트
//           const nextFlat = next.pages.flatMap(p => p.chats)
//           const sum = nextFlat.reduce(
//             (acc, c) => acc + (c.unreadCount ?? 0),
//             0,
//           )
//           if (type === 'dm') dispatch(setDMChatCount(sum))
//           else dispatch(setGroupChatCount(sum))

//           return next
//         },
//       )
//     }

//     if (action.type === 'patch') {
//       const modified = action.changes.filter(c => c.type === 'modified')
//       if (modified.length === 0) return
//       patchCache((flat, old) => {
//         for (const ch of modified) {
//           const id = ch.doc.id
//           const idx = flat.findIndex(x => x.id === id)
//           const data = ch.doc.data() as ChatListItem
//           const fetchData = {
//             ...data,
//             unreadCount: getUnreadCount(data, uid),
//           }
//           if (idx >= 0) flat[idx] = {...flat[idx], ...fetchData, id}
//           else flat.push({...fetchData, id}) // 안전장치
//         }
//         return rebuildPages(flat, old)
//       })
//       return
//     }

//     if (action.type === 'add') {
//       if (!action.docs?.length) return
//       patchCache((flat, old) => {
//         for (const ch of action.docs) {
//           const id = ch.doc.id
//           if (flat.some(x => x.id === id)) continue
//           const data = ch.doc.data() as ChatListItem
//           const fetchData = {
//             ...data,
//             unreadCount: getUnreadCount(data, uid),
//           }
//           flat.push({...fetchData, id})
//         }
//         return rebuildPages(flat, old)
//       })
//       return
//     }

//     if (action.type === 'remove') {
//       if (!action.ids?.length) return
//       patchCache((flat, old) => {
//         const next = flat.filter(x => !action.ids.includes(x.id))
//         return rebuildPages(next, old)
//       })
//       return
//     }
//   },
//   200,
// )
