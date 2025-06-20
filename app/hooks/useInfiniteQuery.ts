import {
  collection,
  endAt,
  getCountFromServer,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  startAfter,
  startAt,
  where,
} from '@react-native-firebase/firestore'
import {QueryClient, useInfiniteQuery} from '@tanstack/react-query'
import {FsSnapshot, PushMessage, RoomInfo, User} from '../types/firebase'

const firestore = getFirestore()
const PAGE_SIZE = 10

export const useUsersInfinite = (searchText: string = '') => {
  return useInfiniteQuery({
    queryKey: ['users', searchText],
    queryFn: async ({pageParam}: {pageParam?: FsSnapshot}) => {
      const usersRef = collection(firestore, 'users')
      // let q = query(usersRef, orderBy('status', 'desc'), limit(PAGE_SIZE));
      let q = null

      if (searchText) {
        q = query(
          usersRef,
          orderBy('nickname', 'asc'),
          orderBy('status', 'desc'),
          orderBy('lastSeen', 'desc'),
          startAt(searchText),
          endAt(searchText + '\uf8ff'),
          limit(PAGE_SIZE),
        )
      } else {
        q = query(
          usersRef,
          orderBy('status', 'desc'),
          orderBy('lastSeen', 'desc'),
          limit(PAGE_SIZE),
        )
      }

      //다음 페이지 요청
      if (pageParam) q = query(q, startAfter(pageParam))

      const snapshot = await getDocs(q)
      const users = snapshot.docs.map(doc => ({
        uid: doc?.id,
        ...doc.data(),
      })) as User[]
      return {
        users, //데이터
        lastVisible: snapshot.docs[snapshot.docs.length - 1] ?? null, //현재 보고 있는 페이지커서
        isLastPage: snapshot.docs.length < PAGE_SIZE, //마지막 페이지 유무
      }
    },
    //queryFn에서 return 하는 값들
    getNextPageParam: lastPage => {
      return lastPage.isLastPage ? undefined : lastPage.lastVisible
    },
    initialPageParam: undefined,
  })
}

// 유저별 마지막 읽은 시간
const getUserLastRead = async (roomId: string, userId: string) => {
  const lastReadRef = collection(firestore, `chats/${roomId}/readStatus`)
  const snap = await getDocs(query(lastReadRef, where('uid', '==', userId)))
  const data = snap.docs[0]?.data()
  return data?.lastReadTimestamps ?? 0
}

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

interface pageType {
  chats: RoomInfo[]
  lastVisible: unknown | null
  isLastPage: boolean
}

export function updateChatListCache(
  queryClient: QueryClient,
  userId: string,
  message: PushMessage,
) {
  const queryKey = ['chats', userId]
  const prev = queryClient.getQueryData<{
    pages: pageType[]
    pageParams: unknown[]
  }>(queryKey)
  if (!prev) return
  const pages = prev.pages
  const flatList = pages?.flatMap(e => e?.chats || [])

  // 현재 채팅방 존재 여부 확인
  const exist = flatList.find(room => room.id === message.chatId)
  let updatedFlat: RoomInfo[] = []

  if (exist) {
    updatedFlat = flatList.map(room =>
      room.id === message.chatId
        ? ({
            ...room,
            lastMessage: message,
            unreadCount: (room.unreadCount ?? 0) + 1,
          } as RoomInfo)
        : room,
    )
  } else {
    // 새 채팅방 추가
    const newRoom: RoomInfo = {
      id: message.chatId,
      lastMessage: message,
      createdAt: message.createdAt,
      unreadCount: 1,
      type: 'dm',
      members: [userId, message.senderId], // 또는 다른 방식으로 초기화
    }
    updatedFlat = [newRoom, ...flatList]
  }
  updatedFlat.sort(
    (a, b) =>
      (b?.lastMessage?.createdAt || 0) - (a?.lastMessage?.createdAt || 0),
  )
  // 기존과 같은 page 크기로 다시 나누기 (여기선 첫 페이지 길이 기준)
  const perPage = PAGE_SIZE
  const newPages: pageType[] = []

  for (let i = 0; i < flatList.length; i += perPage) {
    const chunk = updatedFlat.slice(i, i + perPage)
    newPages.push({
      chats: chunk,
      lastVisible: prev.pages[i].lastVisible, // ⚠️ 이 값은 클라이언트가 임의로 판단 불가하므로 null 처리
      isLastPage: chunk.length < perPage,
    })
  }
  queryClient.setQueryData(queryKey, {
    ...prev,
    pages: newPages,
  })
}

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
