import useLogout from '@app/features/auth/hooks/useLogout'
import {analytics} from '@app/shared/services/analytics'
import type {User} from '@app/shared/types/auth'
import type {AppDispatch} from '@app/store/store'
import {fetchUserById} from '@app/store/userSlice'
import {useCallback} from 'react'
import {Alert} from 'react-native'
import {useDispatch} from 'react-redux'

type AuthProfileGateResult =
  | {
      allowed: true
      reason: 'profile_loaded'
      profile: User
      accountStatus: User['accountStatus']
    }
  | {
      allowed: false
      reason: 'profile_missing' | 'blocked_account' | 'fetch_failed'
      profile: null
      accountStatus?: User['accountStatus']
      errorMessage?: string
    }

/**
 * Firebase 인증 이후 Firestore 프로필을 조회하고,
 * 계정 상태 기준으로 앱 접근을 계속 허용할지 판단하는 훅입니다.
 */
export function useAuthProfileGate() {
  const dispatch = useDispatch<AppDispatch>()
  const {logout} = useLogout()

  const checkProfileAccess = useCallback(
    async (uid: string): Promise<AuthProfileGateResult> => {
      const startedAt = Date.now()
      analytics.track('auth_profile_fetch_start', {uid})

      try {
        const profile = await dispatch(fetchUserById(uid)).unwrap()

        if (!profile?.uid) {
          analytics.track('auth_profile_missing', {uid})
          const result: AuthProfileGateResult = {
            allowed: false,
            reason: 'profile_missing',
            profile: null,
          }

          trackProfileGateSuccess(uid, result, startedAt)
          return result
        }

        const blockedStatuses: User['accountStatus'][] = ['reject', 'stop']
        if (blockedStatuses.includes(profile.accountStatus)) {
          analytics.track('auth_blocked_logout', {
            uid,
            accountStatus: profile.accountStatus,
          })
          await logout('blocked_account')
          Alert.alert(
            '접속 제한',
            '회원님의 계정 상태로 인해 접속이 제한되었습니다.\n관리자에게 문의해주세요.',
          )
          const result: AuthProfileGateResult = {
            allowed: false,
            reason: 'blocked_account',
            profile: null,
            accountStatus: profile.accountStatus,
          }

          trackProfileGateSuccess(uid, result, startedAt)
          return result
        }

        const result: AuthProfileGateResult = {
          allowed: true,
          reason: 'profile_loaded',
          profile,
          accountStatus: profile.accountStatus,
        }

        trackProfileGateSuccess(uid, result, startedAt)
        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'unknown'
        analytics.track('auth_profile_fetch_failure', {
          uid,
          durationMs: Date.now() - startedAt,
          errorMessage,
        })

        return {
          allowed: false,
          reason: 'fetch_failed',
          profile: null,
          errorMessage,
        }
      }
    },
    [dispatch, logout],
  )

  return {checkProfileAccess}
}

function trackProfileGateSuccess(
  uid: string,
  result: AuthProfileGateResult,
  startedAt: number,
) {
  analytics.track('auth_profile_fetch_success', {
    uid,
    success: result.allowed,
    reason: result.reason,
    accountStatus: result.accountStatus ?? 'none',
    durationMs: Date.now() - startedAt,
  })
}
