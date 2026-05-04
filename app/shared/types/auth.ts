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

export interface UserJoinRequest {
  email: string
  password: string
  displayName: string
  note: string | null
  intro?: string | null
  photoURL?: string | null | undefined
}

//원래는 신청서만 받고 auth 비밀번호는 안받으려했는데, 편의상 불편할 것 같아서 auth 생성
export interface GuestApplication {
  // 문서 id를 함께 다루고 싶을 때 선택적으로 보유
  id?: string

  // 기본 입력
  email: string
  password: string
  displayName: string
  note: string // 신청 메모(사용자 입력)
  intro: string // 소개(사용자 입력)
  groupId?: string | null // 선택: 그룹 운영 시

  // 상태/검토 정보
  accountStatus: 'pending' | 'confirm' | 'reject' | 'stop'
  approvedAt?: Timestamp | number | FieldValue | null
  approvedBy?: string | null // admin uid
  rejectedAt?: Timestamp | number | FieldValue | null
  rejectedBy?: string | null
  emailVerified?: boolean // (선택) 이메일 인증 여부 스냅샷

  // 메타 시간
  createdAt: Timestamp | number | FieldValue | null
  updatedAt?: Timestamp | number | FieldValue | null

  // (선택) 소유/검토자 추적
  // ownerUid?: string | null // 신청 당사자의 uid(로그인 상태에서 신청하는 경우)
  // reviewerId?: string | null // 검토자 uid
}

export interface termType {
  id: string
  title: string
  content: string
  enabled: boolean
  required?: boolean
}
