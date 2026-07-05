import type {FieldValue, Timestamp} from '@react-native-firebase/firestore'

export interface User {
  id?: string
  uid: string
  displayName: string
  email: string
  authority: 'ADMIN' | 'MANAGER' | 'USER' | 'TEST'
  status: 'online' | 'offline'
  photoURL?: string | null
  lastSeen?: Timestamp | number | FieldValue | null
  isGuest?: boolean // 현재는 무조건 TRUE
  note: string // 신청 메모(사용자 입력)
  intro: string // 소개(사용자 입력)
  groupId?: string | null // 선택: 그룹 운영 시
  groupName?: string | null | undefined
  // 상태/검토 정보
  accountStatus: 'pending' | 'confirm' | 'reject' | 'stop'
  approvedAt?: Timestamp | number | FieldValue | null
  approvedBy?: string | null // admin uid
  rejectedAt?: Timestamp | number | FieldValue | null
  rejectedBy?: string | null
  emailVerified?: boolean // 이메일 인증 여부
  isConfirmed?: boolean // firebase collection 조건비교용

  // 메타 시간
  createdAt: Timestamp | number | FieldValue | null
  updatedAt?: Timestamp | number | FieldValue | null
}
