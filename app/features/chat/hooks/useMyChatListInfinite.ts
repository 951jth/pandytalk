import {chatService} from '@app/features/chat/service/chatService'
import type {ChatListItem} from '@app/shared/types/chat'
import type {FsSnapshot} from '@app/shared/types/firebase'
import {useInfiniteQuery} from '@tanstack/react-query'

export function useMyChatListInfinite(
  userId: string | null | undefined,
  type: ChatListItem['type'] = 'dm',
) {
  // const chats = chatService.getMyChats(userId, t)
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
  })
}
