import {
  getChatDataWithCount,
  rebuildPages,
} from '@app/features/chat/cache/chatListCachePatch'
import {chatService} from '@app/features/chat/service/chatService'
import {ChatListItem} from '@app/shared/types/chat'
import {AppDispatch} from '@app/store/store'
import {setGroupChatCount} from '@app/store/unreadCountSlice'
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

            // 2) remove
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

            // 고민 포인트: 그룹채팅 badge를 subscribe 방식으로 바꿀지 여기서 계속 사용할 지
            const sum = flat.reduce((acc, c) => acc + (c.unreadCount ?? 0), 0)
            // if (type === 'dm') dispatch(setDMChatCount(sum))
            if (type === 'group') dispatch(setGroupChatCount(sum))

            // 5) pages 재구성
            return rebuildPages(flat, old, PAGE_SIZE)
          },
        )
      },
    )

    return () => unsub()
  }, [uid, type, queryClient, dispatch])
}
