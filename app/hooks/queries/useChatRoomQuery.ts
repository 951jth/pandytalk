import {getApp} from '@react-native-firebase/app'
import {
  collection,
  getCountFromServer,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from '@react-native-firebase/firestore'
import {useInfiniteQuery, type QueryClient} from '@tanstack/react-query'
import type {FsSnapshot, RoomInfo} from '../../types/firebase'

interface pageType {
  chats: RoomInfo[]
  lastVisible: unknown | null
  isLastPage: boolean
}

const firestore = getFirestore(getApp())
const PAGE_SIZE = 20

//내 채팅방 조회
export const useMyChatsInfinite = (userId: string | null | undefined) => {
  return useInfiniteQuery({
    enabled: !!userId, // userId 없을 때 쿼리 비활성화
    queryKey: ['chats', userId],
    queryFn: async ({pageParam}: {pageParam?: FsSnapshot}) => {
      const chatsRef = collection(firestore, 'chats')
      try {
        let q = query(
          chatsRef,
          where('members', 'array-contains', userId),
          orderBy('lastMessage.createdAt', 'desc'),
          orderBy('createdAt', 'desc'),
          limit(PAGE_SIZE),
        )

        if (pageParam) {
          q = query(q, startAfter(pageParam))
        }

        const snapshot = await getDocs(q)

        const chats: (RoomInfo & {unreadCount: number})[] = (
          await Promise.all(
            snapshot.docs.map(async doc => {
              const data = doc.data()
              const roomId = doc.id
              const defaultObj = {
                id: roomId,
                type: data.type,
                createdAt: data.createdAt,
                name: data.name,
                image: data.image,
                lastMessage: data.lastMessage,
                members: data?.members ?? [],
                lastReadTimestamps: data.lastReadTimestamps ?? null,
              }
              // members 필드가 없거나 배열이 아니면 기본 데이터만 리턴
              if (!data.members || !Array.isArray(data.members)) {
                return {
                  ...defaultObj,
                  unreadCount: 0,
                }
              }

              const lastReadAt =
                doc.data()?.lastReadTimestamps?.[userId || ''] ?? 0

              const messagesRef = collection(
                firestore,
                `chats/${roomId}/messages`,
              )
              const unreadQ = query(
                messagesRef,
                where('createdAt', '>', lastReadAt),
                where('senderId', '!=', userId),
              )

              let unreadCount = 0
              try {
                const unreadSnap = await getCountFromServer(unreadQ)
                unreadCount = unreadSnap.data().count
              } catch (e) {
                console.warn(`unreadCount fetch failed in room ${roomId}`, e)
              }

              return {
                ...defaultObj,
                unreadCount,
              }
            }),
          )
        ).filter(Boolean)
        return {
          chats,
          lastVisible: snapshot.docs[snapshot.docs.length - 1] ?? null,
          isLastPage: snapshot?.docs?.length < PAGE_SIZE,
        }
      } catch (e) {
        console.error(e)
        return null // 또는 fallback
      }
    },
    getNextPageParam: lastPage =>
      lastPage?.isLastPage ? undefined : lastPage?.lastVisible,
    initialPageParam: undefined,
  })
}

//채팅방 최신 메세지 갱신하기 (현재 채팅방 목록조회에서 갱신하기)
export function updateChatLastReadCache(
  queryClient: QueryClient,
  chatId: string,
  userId: string,
) {
  const queryKey = ['chats', userId]
  const prev = queryClient.getQueryData<{
    pages: pageType[]
  }>(queryKey)
  const newPages = prev?.pages?.map(page => {
    const chats = page?.chats?.map(chat => {
      const findChat = chat?.id == chatId
      return findChat
        ? {
            ...chat,
            unreadCount: 0,
            lastReadTimestamps: {
              ...chat.lastReadTimestamps,
              [userId]: Date.now(),
            },
          }
        : chat
    })
    return {...page, chats}
  })
  queryClient.setQueryData(queryKey, {...prev, pages: newPages})
}
