import {FirebaseFirestoreTypes} from '@react-native-firebase/firestore'

export type FsSnapshot =
  FirebaseFirestoreTypes.QueryDocumentSnapshot<FirebaseFirestoreTypes.DocumentData>

export interface User {
  id?: string
  uid: string
  nickname: string
  email: string
  authority: 'ADMIN' | 'MANAGER' | 'USER'
  status: 'online' | 'offline'
  photoURL?: string
  lastSeen?: Number | null // RN Firebase 기준
  isGuest?: boolean
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

export interface RoomInfo {
  id?: string
  type: string
  createdAt: any
  members?: User | any[]
  groupName?: string // 그룹일 경우만
  groupImage?: string
  lastMessage?: string
}

export interface ChatMessage {
  id?: string
  senderId: string
  text?: string
  type: 'text' | 'image' | 'file'
  imageUrl?: string
  createdAt: FirebaseFirestoreTypes.Timestamp
}
