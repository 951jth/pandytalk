import type {Timestamp} from 'firebase-admin/firestore'

export interface User {
  id?: string
  uid: string
  nickname: string
  email: string
  authority: 'ADMIN' | 'MANAGER' | 'USER'
  status: 'online' | 'offline'
  photoURL?: string
  lastSeen?: Timestamp | number | null // RN Firebase 기준 차후 TimeStamp 로 변경예정
  isGuest?: boolean //현재는 무조건 TRuE
  emailVerified?: boolean //이메일 인증 여부
}

export interface guestApplications {
  // 식별/기본
  uid: string // 신청 시 생성된 Auth UID (로그인/세션과 연결)
  email: string
  emailLower: string // 소문자 정규화(중복/인덱싱 용)
  displayName: string

  // 사용자 입력
  note?: string // 신청메모(사용자 입력)
  intro?: string // 소개(사용자 입력)
  groupId?: string | null // 선택: 그룹 운영 시

  // 상태
  status: 'pending' | 'approved' | 'rejected'
  reviewerNote?: string | null // 관리자 심사 메모(내부용)
  approvedAt?: Timestamp | null
  approvedBy?: string | null // admin uid
  rejectedAt?: Timestamp | null
  rejectedBy?: string | null
  emailVerified?: boolean

  // 시간
  createdAt: Timestamp
  updatedAt: Timestamp
}
