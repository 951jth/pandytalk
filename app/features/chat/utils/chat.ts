import {ChatRoom} from '@app/shared/types/chat'
import {DocChange} from '@app/shared/types/firebase'
import {compareChat, getUnreadCount} from '@app/shared/utils/chat'
import {InfiniteData} from '@tanstack/react-query'

type pageType = {
  chats: ChatRoom[]
  lastVisible: unknown | null
  isLastPage: boolean
}

export const rebuildChatPages = (
  flat: ChatRoom[],
  old: InfiniteData<pageType>,
  pageSize?: number,
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

export const getChatDataWithCount = (uid: string, docs: DocChange[]) => {
  return docs.map(change => {
    const data = change.doc.data() as Omit<ChatRoom, 'id'>
    const chat: ChatRoom = {
      ...data,
      id: change.doc.id,
    }
    return {
      ...chat,
      unreadCount: getUnreadCount(chat, uid),
    }
  })
}
