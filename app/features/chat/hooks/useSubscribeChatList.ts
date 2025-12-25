import {
  getChatDataWithCount,
  rebuildPages,
} from '@app/features/chat/cache/chatListCachePatch'
import {chatService} from '@app/features/chat/service/chatService'
import {ChatListItem} from '@app/shared/types/chat'
import {AppDispatch} from '@app/store/store'
import {setDMChatCount, setGroupChatCount} from '@app/store/unreadCountSlice'
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
  const queryClient = useQueryClient()
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    if (!uid) return

    let isInitial = true
    const unsub = chatService.subscribeMyChats(
      {uid, type, pageSize: PAGE_SIZE},
      changes => {
        if (isInitial) {
          isInitial = false
          return
        }
        if (!changes?.length) return

        queryClient.setQueriesData<InfiniteData<pageType>>(
          {queryKey: ['chats', type, uid], exact: false},
          old => {
            if (!old) return old

            const upsertChanges = changes.filter(
              c => c.type === 'added' || c.type === 'modified',
            )
            const removedChanges = changes.filter(c => c.type === 'removed')

            // 1) flat
            let flat: ChatListItem[] = old.pages.flatMap(p => p.chats ?? [])

            // 2) remove 먼저 (정합성/중복 방지에 유리)
            if (removedChanges.length > 0) {
              const removeIds = new Set(removedChanges.map(c => c.doc.id))
              flat = flat.filter(chat => !removeIds.has(chat.id))
            }

            // 3) upsert
            if (upsertChanges.length > 0) {
              const items = getChatDataWithCount(uid, upsertChanges)

              const indexById = new Map<string, number>()
              flat.forEach((chat, idx) => indexById.set(chat.id, idx))

              for (const item of items) {
                const idx = indexById.get(item.id)
                if (idx !== undefined) {
                  // 기존 -> 머지
                  flat[idx] = {...flat[idx], ...item}
                } else {
                  // 신규 -> push
                  flat.push(item)
                  indexById.set(item.id, flat.length - 1)
                }
              }
            }

            // 4) badge sum (remove만 와도 업데이트 되게 여기서 한번만)
            // 고민 포인트: dispatch를 외부로 뺄까?
            // hook으로 뺴서 사용할 지 고민중
            const sum = flat.reduce((acc, c) => acc + (c.unreadCount ?? 0), 0)
            if (type === 'dm') dispatch(setDMChatCount(sum))
            else dispatch(setGroupChatCount(sum))

            // 5) pages 재구성
            return rebuildPages(flat, old, PAGE_SIZE)
          },
        )
      },
    )

    return () => unsub()
  }, [uid, type, queryClient, dispatch])
}
