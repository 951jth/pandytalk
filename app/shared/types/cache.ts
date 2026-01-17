// cacheResetTypes.ts
export type CacheResetScope = 'all' | 'rooms' | 'messages' | 'room'

export type CacheResetOp = {
  token: number
  scope: CacheResetScope
  roomId?: string
  reason?: string
  issuedBy: string
  issuedAt: number // server timestamp millis
}
