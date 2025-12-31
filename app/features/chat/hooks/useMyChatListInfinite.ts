import {chatService} from '@app/features/chat/service/chatService'
import type {ChatListItem} from '@app/shared/types/chat'
import type {FsSnapshot} from '@app/shared/types/firebase'
import {useInfiniteQuery} from '@tanstack/react-query'

export function useMyChatListInfinite(
  userId: string | null | undefined,
  type: ChatListItem['type'] = 'dm',
) {
  return useInfiniteQuery({
    queryKey: ['chats', type, userId],
    enabled: !!userId,
    initialPageParam: undefined as FsSnapshot | undefined,
    queryFn: async ({pageParam}) => {
      if (!userId) return {chats: [], lastVisible: null, isLastPage: true}
      const {chats, lastVisible, isLastPage} = await chatService.getMyChats({
        userId,
        type,
        pageParam,
        pageSize: 20,
      })

      return {
        chats,
        lastVisible,
        isLastPage,
      }
    },
    getNextPageParam: lastPage =>
      lastPage?.isLastPage
        ? undefined
        : (lastPage?.lastVisible as FsSnapshot | undefined),
    //탭 언리드 카운트 계산용
    select: data => {
      const chats = data.pages.flatMap(p => p.chats ?? [])
      const totalUnreadCount = chats?.reduce(
        (acc: number, chat: ChatListItem) => {
          return (acc += chat?.unreadCount ?? 0)
        },
        0,
      )

      return {
        ...data,
        meta: {totalUnreadCount},
      }
    },
  })
}
