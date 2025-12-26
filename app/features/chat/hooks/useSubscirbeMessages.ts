import {messageLocal} from '@app/features/chat/data/messageLocal.sqlite'
import {messageService} from '@app/features/chat/service/messageService'
import type {ChatMessage} from '@app/shared/types/chat'
import type {ReactQueryPageType} from '@app/shared/types/react-quert'
import {mergeMessages} from '@app/shared/utils/chat'
import {useQueryClient, type InfiniteData} from '@tanstack/react-query'
import {useEffect, useRef} from 'react'

type MessagesInfiniteData = InfiniteData<ReactQueryPageType<ChatMessage>>

const init: MessagesInfiniteData = {
  pages: [
    {
      data: [] as ChatMessage[],
      lastVisible: null, // 쓰지 않으면 null
      isLastPage: true, // 초기엔 true로 둬도 무방
    },
  ],
  pageParams: [undefined],
}

export const useSubscriptionMessages = (roomId: string | null | undefined) => {
  const queryClient = useQueryClient()
  const unsubRef = useRef<(() => void) | null>(null)
  // let unsubscribe = () => {}

  const setMessageQueryData = (newMessages: ChatMessage[]) => {
    queryClient.setQueryData(
      ['chatMessages', roomId],
      (old: MessagesInfiniteData | undefined) => {
        const cur = old ?? init
        const merged = mergeMessages(cur.pages[0]?.data || [], newMessages)
        return {
          ...(old ?? init), //초기값이 없는 경우가 있음.
          pages: [{...cur.pages[0], data: merged}, ...cur.pages.slice(1)],
        }
      },
    )
  }
  const setupSusscribeChatMessages = async () => {
    try {
      if (!roomId) return
      const localMaxSeq = await messageLocal.getMaxLocalSeq(roomId)
      const newMsgs = await messageService.syncNewMessages(roomId, localMaxSeq)
      setMessageQueryData(newMsgs)
      const lastSeq =
        newMsgs.length > 0
          ? newMsgs.reduce((acc, m) => Math.max(acc, m.seq ?? 0), 0)
          : 0

      unsubRef.current = await messageService.subscribeChatMessages(
        roomId,
        lastSeq,
        (newMessages: ChatMessage[]) => {
          queryClient.setQueryData(
            ['chatMessages', roomId],
            (old: MessagesInfiniteData | undefined) => {
              const cur = old ?? init
              const merged = mergeMessages(
                cur.pages[0]?.data || [],
                newMessages,
              )
              return {
                ...(old ?? init), //초기값이 없는 경우가 있음.
                pages: [{...cur.pages[0], data: merged}, ...cur.pages.slice(1)],
              }
            },
          )
        },
      )
    } catch (e) {
      return () => {}
    }
  }

  useEffect(() => {
    setupSusscribeChatMessages()
    return () => {
      if (unsubRef.current) {
        unsubRef.current() // 소켓/리스너 해제
        unsubRef.current = null
      }
    }
  }, [roomId])
}
