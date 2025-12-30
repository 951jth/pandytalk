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

export const useSyncAndSubsMessages = (roomId: string | null | undefined) => {
  const queryClient = useQueryClient()
  const unsubRef = useRef<(() => void) | null>(null)

  const setMessageQueryData = (newMessages: ChatMessage[]) => {
    queryClient.setQueryData(
      ['chatMessages', roomId],
      (old: MessagesInfiniteData | undefined) => {
        console.log('old', old)
        const cur = old ?? init
        const merged = mergeMessages(cur.pages[0]?.data || [], newMessages)
        return {
          ...(old ?? init), //초기값이 없는 경우가 있음.
          pages: [{...cur.pages[0], data: merged}, ...cur.pages.slice(1)],
        }
      },
    )
  }

  useEffect(() => {
    let isCancelled = false
    // 만약 동기화(syncNewMessages)나 구독(subscribeChatMessages)이
    // 완료되기 전에 **사용자가 페이지를 이탈(Unmount)**하면
    // 클린업 함수가 실행된 이후에 이전에 실행된 구독로직이 트리거 되고, 메모리에 남아있음
    const setupSusscribeChatMessages = async () => {
      try {
        if (!roomId) return
        let newMsgs: ChatMessage[] = []
        //1. 현재 시점으로 메세지 동기화
        const localMaxSeq = await messageLocal.getMaxLocalSeq(roomId)
        // 만약 await 중에 컴포넌트가 언마운트 되었다면 중단
        if (isCancelled) return
        //채팅방이 없는경우도 존재함
        try {
          //e데이터가 없어도 흡수
          newMsgs = await messageService.syncNewMessages(roomId, localMaxSeq)
          setMessageQueryData(newMsgs)
        } catch (e) {}

        const lastSeq =
          newMsgs.length > 0
            ? newMsgs.reduce((acc, m) => Math.max(acc, m.seq ?? 0), localMaxSeq)
            : localMaxSeq
        //2. 마지막 시퀀스를 기준으로 구독 시작
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
                  pages: [
                    {...cur.pages[0], data: merged},
                    ...cur.pages.slice(1),
                  ],
                }
              },
            )
          },
        )
      } catch (e) {
        console.log(e)
        return () => {}
      }
    }
    setupSusscribeChatMessages()
    return () => {
      isCancelled = true // 비동기 작업 취소 플래그 설정
      if (unsubRef.current) {
        unsubRef.current() // 소켓/리스너 해제
        unsubRef.current = null
      }
    }
  }, [roomId])
}
