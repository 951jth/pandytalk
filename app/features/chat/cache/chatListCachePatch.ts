import {ChatListItem} from '@app/shared/types/chat'
import {compareChat} from '@app/shared/utils/chat'
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
  | {type: 'upsert'; items: ChatListItem[]} // added + modified 통합
  | {type: 'remove'; ids: string[]}

//mutator -> action 방식으로 교체
export const patchCacheByAction = (action: PatchCacheAction) => {}

export const dispatchChatUnreadCount = () => {}
