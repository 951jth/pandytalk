import {auth} from '@app/shared/firebase/firestore'
import {useLogout} from '@app/shared/hooks/useLogout'
import {analytics} from '@app/shared/services/analytics'
import {logger} from '@app/shared/services/logger'
import {useAppSelector} from '@app/store/reduxHooks'
import type {AppDispatch} from '@app/store/store'
import {fetchUserById} from '@app/store/userSlice'
import {
  onAuthStateChanged,
  type FirebaseAuthTypes,
} from '@react-native-firebase/auth'
import {useCallback, useEffect, useState} from 'react'
import {Alert} from 'react-native'
import {useDispatch} from 'react-redux'

/**
 * [Helper] 앱 진입 판정 사유를 결정하는 함수
 */
function getAuthGateDecisionReason(
  canEnterApp: boolean,
  hasAuthUser: boolean,
  isUserInfoLoaded: boolean,
  accountStatus?: string,
  allowedStatuses: string[] = [],
): string {
  if (canEnterApp) return 'ready'
  if (!hasAuthUser) return 'firebase_user_null'
  // 이제 profile_not_loaded여도 진입할 수 있으므로, reason에서 이 상태는 '진입 중'을 의미하게 됨
  if (!isUserInfoLoaded) return 'profile_loading'
  if (!allowedStatuses.includes(accountStatus ?? '')) return 'status_not_allowed'
  return 'unknown'
}

/**
 * [Helper] 판정 결과를 로깅 및 아날리틱스에 기록하는 함수
 */
function logAuthGateDecision(params: {
  canEnterApp: boolean
  reason: string
  hasAuthUser: boolean
  isUserInfoLoaded: boolean
  accountStatus: string
}) {
  const {canEnterApp, reason, hasAuthUser, isUserInfoLoaded, accountStatus} =
    params

  logger.info('AuthGate Result', {
    canEnterApp,
    hasAuthUser,
    isUserInfoLoaded,
    accountStatus,
    reason,
  })

  // ✅ [DEBUG] 인증은 됐는데 튕기는 경우만 상세 추적을 위해 에러 로그 발생
  if (hasAuthUser && !canEnterApp) {
    logger.error(`[DEBUG_AUTH_GATE_FAIL] reason: ${reason}`, {
      accountStatus,
      isUserInfoLoaded,
      hasAuthUser,
    })
  }

  analytics.track('auth_gate_decision', {
    result: canEnterApp ? 'app' : 'auth',
    reason,
    hasAuthUser,
    hasUserInfo: isUserInfoLoaded,
    accountStatus,
  })
}

export function useAuthGate() {
  const [fbUser, setFbUser] = useState<FirebaseAuthTypes.User | null>(null)
  const [initializing, setInitializing] = useState(true)

  const dispatch = useDispatch<AppDispatch>()
  const {data: userInfo} = useAppSelector(state => state.user)
  const {logout} = useLogout()

  const fetchProfile = useCallback(
    async (uid: string) => {
      const profile = await dispatch(fetchUserById(uid)).unwrap()

      if (!profile?.uid) {
        analytics.track('auth_profile_missing', {uid})
        return null
      }

      const blockedStatuses = ['reject', 'stop']
      if (blockedStatuses.includes(profile?.accountStatus)) {
        analytics.track('auth_blocked_logout', {
          uid,
          accountStatus: profile.accountStatus,
        })
        await logout('blocked_account')
        Alert.alert(
          '접속 제한',
          '회원님의 계정 상태로 인해 접속이 제한되었습니다.\n관리자에게 문의해주세요.',
        )
        return null
      }

      return profile
    },
    [dispatch, logout],
  )

  useEffect(() => {
    let isEffectActive = true

    const unsubscribe = onAuthStateChanged(auth, user => {
      void (async () => {
        logger.info('AuthGate: onAuthStateChanged fired', {
          uid: user?.uid ?? 'null',
        })

        if (!isEffectActive) return

        setInitializing(true)
        setFbUser(user)

        if (!user?.uid) {
          analytics.identify(null)
          setInitializing(false)
          return
        }

        analytics.identify(user.uid)
        const profileFetchStartedAt = Date.now()

        try {
          analytics.track('auth_profile_fetch_start', {uid: user.uid})
          const profile = await fetchProfile(user.uid)

          analytics.track('auth_profile_fetch_success', {
            uid: user.uid,
            success: !!profile,
            accountStatus: profile?.accountStatus ?? 'none',
            durationMs: Date.now() - profileFetchStartedAt,
          })
        } catch (err) {
          analytics.track('auth_profile_fetch_failure', {
            uid: user.uid,
            durationMs: Date.now() - profileFetchStartedAt,
            errorMessage: err instanceof Error ? err.message : 'unknown',
          })
        } finally {
          if (isEffectActive) {
            setInitializing(false)
          }
        }
      })()
    })
    return () => {
      isEffectActive = false
      unsubscribe()
    }
  }, [fetchProfile])

  const hasAuthUser = !!fbUser?.uid
  const isUserInfoLoaded = !!userInfo?.uid
  const allowedStatuses = ['confirm', 'pending']

  /**
   * [ Snappy Logic ]
   * 1. Firebase 인증만 되어 있다면(hasAuthUser), 프로필 로드 전이라도 일단 앱 진입을 허용합니다.
   * 2. 이후 백그라운드에서 fetchProfile이 실패하거나 차단된 유저임이 밝혀지면 로그아웃 처리되어 튕겨나갑니다.
   */
  const canEnterApp = hasAuthUser

  // 스플래시는 오직 Firebase 초기화(initializing) 동안에만 보여줍니다.
  const shouldShowSplash = initializing

  const reason = getAuthGateDecisionReason(
    canEnterApp,
    hasAuthUser,
    isUserInfoLoaded,
    userInfo?.accountStatus,
    allowedStatuses,
  )

  useEffect(() => {
    if (shouldShowSplash) return

    logAuthGateDecision({
      canEnterApp,
      reason,
      hasAuthUser,
      isUserInfoLoaded,
      accountStatus: userInfo?.accountStatus ?? 'none',
    })
  }, [
    reason,
    canEnterApp,
    hasAuthUser,
    isUserInfoLoaded,
    shouldShowSplash,
    userInfo?.accountStatus,
  ])

  return {shouldShowSplash, canEnterApp}
}
