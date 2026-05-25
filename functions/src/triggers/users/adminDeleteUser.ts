import * as logger from 'firebase-functions/logger'
import {onRequest} from 'firebase-functions/v2/https'
import {getAuth} from 'firebase-admin/auth'
import type {Response} from 'express'
import {db} from '../../core/firebase'

const ADMIN_DELETE_USER_ERROR = {
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  INVALID_ARGUMENT: 'INVALID_ARGUMENT',
  NOT_FOUND: 'NOT_FOUND',
  FAILED_PRECONDITION: 'FAILED_PRECONDITION',
  INTERNAL: 'INTERNAL',
} as const

const toBearerToken = (authorization?: string) => {
  if (!authorization?.startsWith('Bearer ')) return undefined
  return authorization.slice('Bearer '.length).trim()
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

const sendError = (
  res: Response,
  status: number,
  code: keyof typeof ADMIN_DELETE_USER_ERROR,
  message: string,
) => {
  res.status(status).json({ok: false, code, message})
}

export const adminDeleteUser = onRequest(
  {
    region: 'asia-northeast3',
    cors: true,
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      sendError(res, 405, 'INVALID_ARGUMENT', 'POST 요청만 허용됩니다.')
      return
    }

    try {
      const idToken = toBearerToken(req.headers.authorization)
      if (!idToken) {
        sendError(res, 401, 'UNAUTHENTICATED', '인증 토큰이 필요합니다.')
        return
      }

      const decoded = await getAuth().verifyIdToken(idToken)
      const adminUid = decoded.uid
      const adminSnap = await db.doc(`users/${adminUid}`).get()
      const adminData = adminSnap.data()

      if (adminData?.authority !== 'ADMIN') {
        sendError(res, 403, 'PERMISSION_DENIED', '관리자 권한이 필요합니다.')
        return
      }

      const body = isRecord(req.body) ? req.body : {}
      const targetUid =
        typeof body.uid === 'string' ? body.uid.trim() : undefined

      if (!targetUid) {
        sendError(res, 400, 'INVALID_ARGUMENT', '삭제할 uid가 필요합니다.')
        return
      }

      if (targetUid === adminUid) {
        sendError(
          res,
          400,
          'FAILED_PRECONDITION',
          '본인 계정은 관리자 삭제로 처리할 수 없습니다.',
        )
        return
      }

      const targetSnap = await db.doc(`users/${targetUid}`).get()
      if (!targetSnap.exists) {
        sendError(res, 404, 'NOT_FOUND', '삭제할 유저 정보를 찾을 수 없습니다.')
        return
      }

      const targetData = targetSnap.data()
      if (targetData?.authority === 'ADMIN' || targetData?.authority === 'TEST') {
        sendError(
          res,
          400,
          'FAILED_PRECONDITION',
          '관리자 또는 테스트 계정은 삭제할 수 없습니다.',
        )
        return
      }

      await getAuth().deleteUser(targetUid)

      logger.info('[adminDeleteUser] Auth user deleted by admin', {
        adminUid,
        targetUid,
      })

      res.json({ok: true})
    } catch (error) {
      logger.error('[adminDeleteUser] Failed to delete user', error)
      sendError(res, 500, 'INTERNAL', '유저 삭제 중 오류가 발생했습니다.')
    }
  },
)
