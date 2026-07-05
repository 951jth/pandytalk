import type {ChatMessage, ChatRoom} from '@app/shared/types/chat'
import type {ServerTime} from '@app/shared/types/firebase'
import {compareChat} from '@app/shared/utils/chat'

const chat = (params: Partial<ChatRoom>): ChatRoom =>
  ({
    id: params.id ?? 'chat',
    type: 'group',
    members: [],
    ...params,
  }) as ChatRoom

const timestamp = (ms: number) =>
  ({toMillis: () => ms}) as unknown as ServerTime

const message = (createdAt: number): ChatMessage => ({
  id: `message-${createdAt}`,
  senderId: 'user',
  type: 'text',
  createdAt,
})

describe('compareChat', () => {
  it('lastMessageAt 기준으로 최신 채팅을 먼저 정렬한다', () => {
    const oldLastMessageNewLastMessageAt = chat({
      id: 'a',
      lastMessageAt: timestamp(3000),
      lastMessage: message(1000),
    })
    const newLastMessageOldLastMessageAt = chat({
      id: 'b',
      lastMessageAt: timestamp(2000),
      lastMessage: message(4000),
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
      lastMessage: message(1000),
    })
    const newer = chat({
      id: 'newer',
      lastMessage: message(2000),
    })

    expect([older, newer].sort(compareChat).map(item => item.id)).toEqual([
      'newer',
      'older',
    ])
  })
})
