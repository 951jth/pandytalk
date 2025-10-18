import {getApp} from '@react-native-firebase/app'
import {
  collection,
  getCountFromServer,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  where,
  type FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore'
import {
  useInfiniteQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import {useEffect} from 'react'
import type {ChatListItem, PushMessage} from '../../types/chat'
import type {FsSnapshot} from '../../types/firebase'
import {sortKey} from '../../utils/firebase'
import {useDebouncedCallback} from '../useDebounceCallback'

interface pageType {
  chats: ChatListItem[]
  lastVisible: unknown | null
  isLastPage: boolean
}

const firestore = getFirestore(getApp())
const PAGE_SIZE = 20

async function setUnreadMembersByChat(
  docs: FirebaseFirestoreTypes.QueryDocumentSnapshot<FirebaseFirestoreTypes.DocumentData>[],
  userId: string | null | undefined,
) {
  return await Promise.all(
    docs.map(async doc => {
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

      const lastReadAt = doc.data()?.lastReadTimestamps?.[userId || ''] ?? 0

      const messagesRef = collection(firestore, `chats/${roomId}/messages`)
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
}

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
          orderBy('lastMessage.createdAt', 'desc'), //가장 마지막 메세지의 생성시간
          orderBy('createdAt', 'desc'), //생성 날짜 기준
          limit(PAGE_SIZE),
        )

        if (pageParam) {
          q = query(q, startAfter(pageParam))
        }

        const snapshot = await getDocs(q)

        const chats = await setUnreadMembersByChat(snapshot?.docs, userId)

        return {
          chats,
          lastVisible: snapshot.docs[snapshot.docs.length - 1] ?? null,
          isLastPage: snapshot?.docs?.length < PAGE_SIZE,
        }
      } catch (e) {
        console.error(e)
        return {
          chats: [],
          lastVisible: null,
          isLastPage: true,
        } // 또는 fallback
      }
    },
    getNextPageParam: lastPage =>
      lastPage?.isLastPage ? undefined : lastPage?.lastVisible,
    initialPageParam: undefined,
  })
}

/** 화면 마운트 시 1페이지만 실시간 구독 */
/**
 * 채팅방 목록 헤드(첫 페이지)에 스냅샷 구독을 걸고,
 * 변경이 감지되면 ['chats', userId] 쿼리를 invalidate해서 재조회합니다.
 */
export function useChatListHeadSubscription(userId: string | null | undefined) {
  const queryClient = useQueryClient()

  //채팅방 갱신이 여러번되더라도 200초동안 반응이 없을떄 다시 조회함
  const invalidate = useDebouncedCallback((shouldRefetch: Boolean) => {
    if (!userId) return
    //invalidateQueries:
    //  해당하는 캐시 데이터를 “더 이상 최신이 아님” 상태로 표시하는 옵션
    queryClient.refetchQueries({
      queryKey: ['chats', userId],
      type: 'active',
      // true면 첫 페이지만 리팻칭 하는 옵션
      exact: !shouldRefetch,
    })
  }, 200)

  useEffect(() => {
    if (!userId) return

    const chatsRef = collection(firestore, 'chats')
    // 첫 페이지 기준으로 구독 — 정렬/조건은 useMyChatsInfinite의 queryFn과 동일하게
    const q = query(
      chatsRef,
      where('members', 'array-contains', userId),
      orderBy('lastMessage.createdAt', 'desc'),
      orderBy('createdAt', 'desc'),
      limit(PAGE_SIZE),
    )

    const unsub = onSnapshot(
      q,
      snap => {
        // 변경이 실제로 있었을 때만 invalidate
        const changes = snap.docChanges()
        if (changes.length === 0) return
        const shouldRefetch = changes.some(c =>
          ['added', 'removed'].includes(c.type),
        ) //채팅방에 제거되거나 추가됫다고 감지한 경우에 모든 페이지를 조회하도록
        //아닌경우 첫페이지만 갱신

        invalidate(shouldRefetch)
      },
      error => {
        // 스냅샷 에러 시에도 안전하게 한 번 invalidate(네트워크 복구 후 재조회)
        console.error('[chat head snapshot] error:', error)
        invalidate(false)
      },
    )

    return () => unsub()
  }, [userId, queryClient, invalidate])
}

//현재 채팅방의 목록 및 최신데이터를 갱신하면 함수임
//현재는 채팅방 목록조회시 onSnapShot을 걸어서 사용하지 않고있음.
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
  const pages = prev?.pages ?? []
  const flatList = pages?.flatMap(e => e?.chats || [])
  // 현재 채팅방 존재 여부 확인
  const exist = flatList.find(room => room.id === message.chatId)
  let updatedFlat: ChatListItem[] = []

  if (exist) {
    updatedFlat = flatList.map(room =>
      room.id === message.chatId
        ? ({
            ...room,
            lastMessage: message,
            unreadCount: (room.unreadCount ?? 0) + 1,
          } as ChatListItem)
        : room,
    )
  } else {
    // 새 채팅방 추가
    const newRoom: ChatListItem = {
      id: message.chatId,
      lastMessage: message,
      createdAt: serverTimestamp(),
      unreadCount: 1,
      type: 'dm',
      members: [userId, message.senderId], // 또는 다른 방식으로 초기화
    }
    updatedFlat = [newRoom, ...flatList]
  }
  updatedFlat.sort((a, b) => sortKey(b) - sortKey(a))
  // 기존과 같은 page 크기로 다시 나누기 (여기선 첫 페이지 길이 기준)
  const perPage = PAGE_SIZE
  const newPages: pageType[] = []

  for (let i = 0; i < updatedFlat.length; i += perPage) {
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

//채팅방 최신 메세지 갱신하기 (현재 채팅방 목록조회에서 갱신하기, 채팅방 메세지 추가됬을시)
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
              [userId]: serverTimestamp(),
              // [userId]: FieldValue.serverTimestamp(),
            },
          }
        : chat
    })
    return {...page, chats}
  })
  queryClient.setQueryData(queryKey, {...prev, pages: newPages ?? []})
}
