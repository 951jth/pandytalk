import {messageService} from '@app/features/chat/service/messageService'
import type {ChatMessage} from '@app/shared/types/chat'
import type {ReactQueryPageType} from '@app/shared/types/react-quert'
import {mergeMessages} from '@app/shared/utils/chat'
import {useQueryClient, type InfiniteData} from '@tanstack/react-query'
import {useEffect} from 'react'

type MessagesInfiniteData = InfiniteData<ReactQueryPageType<ChatMessage>>

export const useSubscriptionMessages = (
  roomId: string | null | undefined,
  lastCreatedAt: number | null | undefined,
) => {
  const queryClient = useQueryClient()
  let unsubscribe = () => {}

  const setupSusscribeChatMessages = async () => {
    try {
      unsubscribe = await messageService.subscribeChatMessages(
        roomId,
        lastCreatedAt,
        (newMessages: ChatMessage[]) => {
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
      unsubscribe() // 안전하게 해제 실행
    }
    // return () => unsub?.()
  }, [roomId, lastCreatedAt])
}
