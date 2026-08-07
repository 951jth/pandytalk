import {
  setChatMessagePayload,
} from '@app/features/chat/utils/message'
import {rebuildInfiniteQueryPages} from '@app/features/chat/utils/infiniteQuery'
import {mockMessages, mockRoomInfo, mockUser} from '@app/shared/test/mocks'
import type {ChatMessage} from '@app/shared/types/chat'
import type {InfiniteData} from '@tanstack/react-query'

type MessagePage = {
  data: ChatMessage[]
  lastVisible: unknown | null
  isLastPage: boolean
}

jest.mock('@app/features/chat/data/messageRemote.firebase', () => ({
  messageRemote: {
    generateMessageId: jest.fn(() => 'mock-msg-id'),
  },
}))

describe('message.ts', () => {
  describe('setChatMessagePayload', () => {
    it('내용이 없으면 에러값 리턴', () => {
      expect(() =>
        setChatMessagePayload({
          roomInfo: mockRoomInfo,
          user: mockUser,
          message: {
            type: 'text',
            text: '',
          },
        }),
      ).toThrow('내용을 입력해주세요.')
    })
    it('이미지 선택 안하면 에러값 리턴', () => {
      expect(() =>
        setChatMessagePayload({
          roomInfo: mockRoomInfo,
          user: mockUser,
          message: {
            type: 'image',
            imageUrl: '',
            text: '',
          },
        }),
      ).toThrow('이미지를 선택해주세요.')
    })
    it('텍스트 메세지 페이로드 생성', () => {
      const payload = setChatMessagePayload({
        roomInfo: mockRoomInfo,
        user: mockUser,
        message: {
          type: 'text',
          text: '안녕하세요',
        },
      })
      expect(payload).toBeDefined()
      expect(payload?.text).toBe('안녕하세요')
      expect(payload?.senderId).toBe('user_1')
      expect(payload?.senderName).toBe('홍길동')
      expect(payload?.senderPicURL).toBe('https://example.com/avatar.jpg')
      expect(payload?.createdAt).toBeDefined()
      expect(payload?.roomTitle).toBe('테스트방')
    })
    it('텍스트 앞뒤 공백 제거 확인', () => {
      const payload = setChatMessagePayload({
        roomInfo: mockRoomInfo,
        user: mockUser,
        message: {
          type: 'text',
          text: '  공백 제거 확인  ',
        },
      })
      expect(payload?.text).toBe('공백 제거 확인')
    })
    it('길이 제한(5000자) 초과 시 에러', () => {
      const longText = 'a'.repeat(5001)
      expect(() =>
        setChatMessagePayload({
          roomInfo: mockRoomInfo,
          user: mockUser,
          message: {
            type: 'text',
            text: longText,
          },
        }),
      ).toThrow('메시지는 최대 5000자까지 입력 가능합니다.')
    })
    it('이미지 메세지 페이로드 생성', () => {
      const payload = setChatMessagePayload({
        roomInfo: mockRoomInfo,
        user: mockUser,
        message: {
          type: 'image',
          imageUrl: 'https://example.com/image.jpg',
          text: '',
        },
      })
      expect(payload).toBeDefined()
      expect(payload?.text).toBe('')
      expect(payload?.senderId).toBe('user_1')
      expect(payload?.senderName).toBe('홍길동')
      expect(payload?.senderPicURL).toBe('https://example.com/avatar.jpg')
      expect(payload?.createdAt).toBeDefined()
      expect(payload?.roomTitle).toBe('테스트방')
    })
  })
  describe('rebuildInfiniteQueryPages', () => {
    it('메세지 페이지를 재구성한다.', () => {
      const InfiniteData = {
        pages: [
          {
            data: [],
            lastVisible: null,
            isLastPage: true,
          },
        ],
        pageParams: [],
      }
      const {pages} = rebuildInfiniteQueryPages(
        mockMessages(105),
        InfiniteData,
        20,
      )
      expect(pages.length).toBe(6)
      expect(pages[0].data.length).toBe(20)
      expect(pages[1].data.length).toBe(20)
      expect(pages[2].data.length).toBe(20)
      expect(pages[3].data.length).toBe(20)
      expect(pages[4].data.length).toBe(20)
      expect(pages[5].data.length).toBe(5)
      expect(pages[5].isLastPage).toBe(true)
    })

    it('기존의 lastVisible 값을 페이지별로 유지해야 한다.', () => {
      const InfiniteData = {
        pages: [
          {data: [], lastVisible: 'cursor_1', isLastPage: false},
          {data: [], lastVisible: 'cursor_2', isLastPage: true},
        ],
        pageParams: [],
      }
      const {pages} = rebuildInfiniteQueryPages(
        mockMessages(40),
        InfiniteData,
        20,
      )
      expect(pages[0].lastVisible).toBe('cursor_1')
      expect(pages[1].lastVisible).toBe('cursor_2')
    })

    it('마지막이 아닌 페이지는 isLastPage가 false여야 한다.', () => {
      const emptyPages: InfiniteData<MessagePage> = {
        pages: [],
        pageParams: [],
      }
      const {pages} = rebuildInfiniteQueryPages(
        mockMessages(45),
        emptyPages,
        20,
      )

      expect(pages[0].isLastPage).toBe(false)
      expect(pages[1].isLastPage).toBe(false)
      expect(pages[2].isLastPage).toBe(true) // 3번째 페이지(5개)만 true
    })

    it('데이터가 비어있을 경우 기존 페이지를 반환한다.', () => {
      const InfiniteData = {
        pages: [
          {data: [mockMessages(1)[0]], lastVisible: 'cursor', isLastPage: true},
        ],
        pageParams: [],
      }
      const {pages} = rebuildInfiniteQueryPages([], InfiniteData, 20)

      // 로직상 flat이 비면 old.pages를 그대로 반환함
      expect(pages).toEqual(InfiniteData.pages)
    })
  })
})
