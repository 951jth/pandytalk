// cacheResetRemote.ts
import {
  firebaseCall,
  firebaseRefObserver,
} from '@app/shared/firebase/firebaseUtils'
import {firestore} from '@app/shared/firebase/firestore'
import {CacheResetOp} from '@app/shared/types/cache'

import {FirebaseFirestoreTypes} from '@react-native-firebase/firestore'

export const cacheResetRef = (uid: string) =>
  firestore.doc(`users/${uid}/adminOps/cacheReset`)

const toOp = (
  data: FirebaseFirestoreTypes.DocumentData | undefined,
): CacheResetOp | null => {
  if (!data) return null
  if (typeof data.token !== 'number') return null
  if (!data.scope) return null

  return {
    token: data.token,
    scope: data.scope,
    roomId: data.roomId,
    reason: data.reason,
    issuedBy: data.issuedBy ?? 'unknown',
    issuedAt: typeof data.issuedAt === 'number' ? data.issuedAt : Date.now(),
  }
}

export async function fetchRemoteCacheResetOp(
  uid: string,
): Promise<CacheResetOp | null> {
  return firebaseCall(`adminOpsRemote.fetchRemoteCacheResetOp`, async () => {
    const snap = await cacheResetRef(uid).get()
    return toOp(snap.data())
  })
}

export function observeRemoteCacheResetOp(
  uid: string,
  onOp: (op: CacheResetOp | null) => void,
  onError?: (e: any) => void,
) {
  const ref = cacheResetRef(uid)
  return firebaseRefObserver(
    `adminOpsRemote.observeRemoteCacheResetOp`,
    ref,
    snap => onOp(toOp(snap.data())),
    onError,
  )
}
