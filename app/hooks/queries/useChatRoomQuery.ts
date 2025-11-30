import {
  collection,
  doc,
  getDocs,
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
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query'
import {useEffect, useState} from 'react'
import {useDispatch} from 'react-redux'
import {getChatRoomInfoWithMembers} from '../../services/chatService'
import {firestore} from '../../store/firestore'
import {AppDispatch} from '../../store/store'
import {setDMChatCount, setGroupChatCount} from '../../store/unreadCountSlice'
import type {ChatListItem, PushMessage} from '../../types/chat'
import type {FsSnapshot} from '../../types/firebase'
import {compareChat, getUnreadCount} from '../../utils/chat'
import {sortKey} from '../../utils/firebase'
import {useDebouncedCallback} from '../useDebounceCallback'

interface pageType {
  chats: ChatListItem[]
  lastVisible: unknown | null
  isLastPage: boolean
}

const PAGE_SIZE = 20

//내 채팅방 조회
export const useMyChatsInfinite = (
  userId: string | null | undefined,
  type: ChatListItem['type'] = 'dm',
) => {
  return useInfiniteQuery({
    enabled: !!userId,
    queryKey: ['chats', type, userId],
    initialPageParam: undefined as FsSnapshot | undefined,
    queryFn: async ({pageParam}) => {
      if (!userId) {
        return {
          chats: [] as ChatListItem[],
          lastVisible: null,
          isLastPage: true,
        }
      }
      try {
        const chatsRef = collection(firestore, 'chats')
        // 최신 메시지 기준 정렬 + 생성일 보조 정렬 (기존과 동일)
        let q = query(
          chatsRef,
          where('members', 'array-contains', userId),
          where('type', '==', type),
          orderBy('lastMessageAt', 'desc'),
          limit(PAGE_SIZE),
        )

        if (pageParam) {
          // 여러 orderBy가 있어도 snapshot 커서 하나로 OK
          q = query(q, startAfter(pageParam))
        }

        const snapshot = await getDocs(q)

        const chats: ChatListItem[] = snapshot.docs.map(d => {
          const data = d.data() as any
          const unreadCount = getUnreadCount(data, userId)
          return {
            id: d.id,
            name: data?.name,
            image: data?.image,
            type: data.type,
            createdAt: data.createdAt,
            lastMessage: data.lastMessage,
            lastSeq: data?.lastSeq ?? 0,
            members: data.members ?? [],
            lastReadSeqs: data.lastReadSeqs ?? undefined,
            lastReadTimestamps: data.lastReadTimestamps ?? undefined,
            unreadCount,
          }
        })
        return {
          chats,
          lastVisible: snapshot.docs[snapshot.docs.length - 1] ?? null,
          isLastPage: snapshot.docs.length < PAGE_SIZE,
        }
      } catch (e) {
        console.log(e)
      }
    },
    getNextPageParam: lastPage =>
      lastPage?.isLastPage
        ? undefined
        : (lastPage?.lastVisible as FsSnapshot | undefined),
  })
}

//채팅방 구독, 안읽음 메세지도 같이 카운트
/**
 * 리스트 1페이지만 onSnapshot으로 구독.
 * 동시에 collectionGroup('members') 에서 내 멤버십을 한 번에 구독.
 * → unreadCount = max(0, lastSeq - lastReadSeq)
 */
export function useSubscribeChatList(
  uid?: string | null,
  type: ChatListItem['type'] = 'dm',
) {
  const chatsRef = collection(firestore, 'chats')
  const queryClient = useQueryClient()
  const dispatch = useDispatch<AppDispatch>()
  // 🔹 타입별 디스패치 헬퍼
  const dispatchBadge = (t: 'dm' | 'group', count: number) => {
    if (t === 'dm') dispatch(setDMChatCount(count))
    else dispatch(setGroupChatCount(count))
  }

  // 공통: 평탄화 → 정렬 → 페이지 재쪼개기
  const rebuildPages = (
    flat: ChatListItem[],
    old: InfiniteData<pageType>,
  ): InfiniteData<pageType> => {
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

  /**
   * ✅ invalidate(action) 설계
   * - {type:'full'}                         : 전체 refetch (원하면 사용)
   * - {type:'patch', changes}               : modified만 캐시 패치
   * - {type:'add', docs}                    : added 문서 캐시 삽입
   * - {type:'remove', ids}                  : removed 문서 캐시 제거
   */
  const invalidate = useDebouncedCallback(
    (
      action:
        | {type: 'full'}
        | {
            type: 'patch'
            changes: FirebaseFirestoreTypes.DocumentChange[]
          }
        | {
            type: 'add'
            docs: FirebaseFirestoreTypes.DocumentChange[]
          }
        | {
            type: 'remove'
            ids: string[]
          },
    ) => {
      if (!uid) return
      if (action.type === 'full') {
        // 필요 시 전체 재조회(프로젝트 정책에 맞게 선택)
        // refetch?.()
        // queryClient.invalidateQueries({ queryKey: ['chats','dm',uid], refetchType: 'active' as any })
        return
      }

      const patchCache = (
        mutator: (
          flat: ChatListItem[],
          old: InfiniteData<pageType>,
        ) => InfiniteData<pageType>,
      ) => {
        queryClient.setQueriesData<InfiniteData<pageType>>(
          {queryKey: ['chats', type, uid], exact: false},
          old => {
            if (!old) return old
            const flat: ChatListItem[] = old.pages.flatMap(p => p.chats)
            const next = mutator(flat, old)

            // ✅ 합계 계산 & Redux 업데이트
            const nextFlat = next.pages.flatMap(p => p.chats)
            const sum = nextFlat.reduce(
              (acc, c) => acc + (c.unreadCount ?? 0),
              0,
            )
            if (type === 'dm') dispatch(setDMChatCount(sum))
            else dispatch(setGroupChatCount(sum))

            return next
          },
        )
      }

      if (action.type === 'patch') {
        const modified = action.changes.filter(c => c.type === 'modified')
        if (modified.length === 0) return
        patchCache((flat, old) => {
          for (const ch of modified) {
            const id = ch.doc.id
            const idx = flat.findIndex(x => x.id === id)
            const data = ch.doc.data() as ChatListItem
            const fetchData = {
              ...data,
              unreadCount: getUnreadCount(data, uid),
            }
            if (idx >= 0) flat[idx] = {...flat[idx], ...fetchData, id}
            else flat.push({...fetchData, id}) // 안전장치
          }
          return rebuildPages(flat, old)
        })
        return
      }

      if (action.type === 'add') {
        if (!action.docs?.length) return
        patchCache((flat, old) => {
          for (const ch of action.docs) {
            const id = ch.doc.id
            if (flat.some(x => x.id === id)) continue
            const data = ch.doc.data() as ChatListItem
            const fetchData = {
              ...data,
              unrunreadCount: getUnreadCount(data, uid),
            }
            flat.push({...fetchData, id})
          }
          return rebuildPages(flat, old)
        })
        return
      }

      if (action.type === 'remove') {
        if (!action.ids?.length) return
        patchCache((flat, old) => {
          const next = flat.filter(x => !action.ids.includes(x.id))
          return rebuildPages(next, old)
        })
        return
      }
    },
    200,
  )

  useEffect(() => {
    if (!uid) return

    const q = query(
      chatsRef,
      where('type', '==', type),
      where('members', 'array-contains', uid),
      orderBy('lastMessageAt', 'desc'),
      limit(PAGE_SIZE),
    )

    let isInitial = true
    const unsub = onSnapshot(
      q,
      snap => {
        if (isInitial) {
          isInitial = false
          return // 초기 발행은 refetch 생략
        }
        const changes = snap.docChanges()
        if (changes.length === 0) return

        const added = changes.filter(c => c.type === 'added')
        const removed = changes.filter(c => c.type === 'removed')
        const modified = changes.filter(c => c.type === 'modified')
        // ➕ 추가 즉시 반영
        if (added.length) {
          invalidate({type: 'add', docs: added})
        }
        // ➖ 제거 즉시 반영
        if (removed.length) {
          invalidate({type: 'remove', ids: removed.map(r => r.doc.id)})
        }
        // 🔧 수정 즉시 반영
        if (modified.length) {
          invalidate({type: 'patch', changes: modified})
        }
      },
      error => {
        console.error('[chat head snapshot] error:', error)
        // 필요 시: invalidate({ type: 'full' })
      },
    )

    return () => unsub()
  }, [uid])
}

//채팅방 미읽음 카운트 구독 함수, 채팅방 단건 조회임.
export const useSubscribeChatUnreadCount = (
  roomId?: string | undefined | null,
  userId?: string,
) => {
  const [unreadCnt, setUnreadCnt] = useState(0)
  useEffect(() => {
    if (!roomId || !userId) return
    const chatRoomRef = doc(firestore, 'chats', roomId)

    const unsub = onSnapshot(
      chatRoomRef,
      snap => {
        if (!snap.exists()) return
        const chatRoomData = snap.data() as ChatListItem
        console.log(chatRoomData)
        const {lastReadSeqs, lastSeq} = chatRoomData
        const userReadSeq = lastReadSeqs?.[userId] ?? 0
        const userUnreadSeq = (lastSeq || 0) - userReadSeq
        setUnreadCnt(userUnreadSeq > 0 ? userUnreadSeq : 0)
      },
      error => {
        console.error('[chat head snapshot] error:', error)
        // 필요 시: invalidate({ type: 'full' })
      },
    )

    return () => unsub()
  }, [roomId, userId])
  return {unreadCnt}
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
//현재는 subcribe message로 바뀌었음.(사용X)
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

export function useChatRoomInfo(roomId: string | null) {
  return useQuery({
    queryKey: ['chatRoom', roomId],
    enabled: !!roomId,
    queryFn: async () => {
      try {
        if (!roomId) return null
        const roomInfo = await getChatRoomInfoWithMembers(roomId)
        return roomInfo ?? null
      } catch (e) {
        console.log(e)
        return null
      }
    },
  })
}
