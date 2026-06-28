import {User} from '@app/shared/types/auth'
import {ChatMessage, ChatRoom} from '@app/shared/types/chat'
import type {FirebaseFirestoreTypes} from '@react-native-firebase/firestore'

const mockTimestamp = (ms: number): FirebaseFirestoreTypes.Timestamp => {
  const seconds = Math.floor(ms / 1000)
  const nanoseconds = (ms % 1000) * 1_000_000

  return {
    seconds,
    nanoseconds,
    toMillis: () => ms,
    toDate: () => new Date(ms),
    toJSON: () => ({seconds, nanoseconds}),
    valueOf: () => `${seconds}.${String(nanoseconds).padStart(9, '0')}`,
    isEqual: other =>
      other.seconds === seconds && other.nanoseconds === nanoseconds,
  }
}

export const mockUser: User = {
  uid: 'user_1',
  displayName: '홍길동',
  email: 'test@example.com',
  authority: 'USER',
  status: 'online',
  note: '테스트 메모',
  intro: '안녕하세요',
  photoURL: 'https://example.com/avatar.jpg',
  accountStatus: 'confirm',
  createdAt: Date.now(),
}

export const mockRoomInfo: ChatRoom = {
  id: 'room_1',
  name: '테스트방',
  type: 'group',
  createdAt: mockTimestamp(Date.now()),
}

export const mockMessage: ChatMessage = {
  id: 'msg_1',
  senderId: 'user_1',
  senderName: '홍길동',
  senderPicURL: 'https://example.com/avatar.jpg',
  type: 'text',
  text: '안녕하세요',
  createdAt: Date.now(),
}

export const mockMessages: (length?: number) => ChatMessage[] = (
  length = 105,
) =>
  Array.from({length}, (_, i) => ({
    ...mockMessage,
    id: `msg_${Date.now() + i}`,
    createdAt: Date.now() + i,
  })) as ChatMessage[]
