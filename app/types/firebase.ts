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

export interface ChatMessage {
  id?: string
  senderId: string
  text?: string
  type: 'text' | 'image' | 'file'
  imageUrl?: string
  createdAt?: Number
}

export interface RoomInfo {
  id?: string
  type: 'dm' | 'group'
  createdAt?: Number
  members?: string[]
  name?: string // 그룹일 경우만
  image?: string // 그룹일 경우만
  lastMessage?: ChatMessage
  memberInfos?: User[] | null
}
