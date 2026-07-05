export interface UserJoinRequest {
  email: string
  password: string
  displayName: string
  note: string | null
  intro?: string | null
  photoURL?: string | null | undefined
}
