import type {ChatRoom} from '@app/shared/types/chat'
import {compareChat} from '@app/shared/utils/chat'

const chat = (params: Partial<ChatRoom>): ChatRoom =>
  ({
    id: params.id ?? 'chat',
    type: 'group',
    members: [],
    ...params,
  }) as ChatRoom

const timestamp = (ms: number) => ({toMillis: () => ms}) as any

describe('compareChat', () => {
  it('lastMessageAt 기준으로 최신 채팅을 먼저 정렬한다', () => {
    const oldLastMessageNewLastMessageAt = chat({
      id: 'a',
      lastMessageAt: timestamp(3000),
      lastMessage: {createdAt: 1000} as any,
    })
    const newLastMessageOldLastMessageAt = chat({
      id: 'b',
      lastMessageAt: timestamp(2000),
      lastMessage: {createdAt: 4000} as any,
    })

    const sorted = [
      newLastMessageOldLastMessageAt,
      oldLastMessageNewLastMessageAt,
    ].sort(compareChat)

    expect(sorted.map(item => item.id)).toEqual(['a', 'b'])
  })

  it('lastMessageAt이 없으면 lastMessage.createdAt으로 정렬한다', () => {
    const older = chat({
      id: 'older',
      lastMessage: {createdAt: 1000} as any,
    })
    const newer = chat({
      id: 'newer',
      lastMessage: {createdAt: 2000} as any,
    })

    expect([older, newer].sort(compareChat).map(item => item.id)).toEqual([
      'newer',
      'older',
    ])
  })
})
