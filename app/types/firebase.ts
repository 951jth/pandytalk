import {FirebaseFirestoreTypes} from '@react-native-firebase/firestore'

export interface User {
  uid: string
  nickname: string
  email: string
  photoURL?: string
  status: 'online' | 'offline'
  lastSeen?: FirebaseFirestoreTypes.Timestamp // RN Firebase 기준
  authority: 'ADMIN' | 'MANAGER' | 'USER'
}

export interface ChatRoom {
  id?: string // 문서 ID를 담아올 때
  isGroup: boolean
  members: string[] // uid 배열
  groupName?: string // 그룹일 경우만
  groupImage?: string
  lastMessage?: string
  lastMessageTime?: FirebaseFirestoreTypes.Timestamp
}

export interface ChatMessage {
  id?: string
  senderId: string
  text?: string
  type: 'text' | 'image' | 'file'
  imageUrl?: string
  createdAt: FirebaseFirestoreTypes.Timestamp
}
