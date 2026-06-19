import {useAuthProfileGate} from '@app/bootstrap/useAuthProfileGate'
import {auth} from '@app/shared/firebase/firestore'
import {analytics} from '@app/shared/services/analytics'
import {logger} from '@app/shared/services/logger'
import {useAppSelector} from '@app/store/reduxHooks'
import {
  onAuthStateChanged,
  type FirebaseAuthTypes,
} from '@react-native-firebase/auth'
import {useEffect, useState} from 'react'

/**
 * Firebase Auth 상태를 구독하고 루트 진입 상태를 결정하는 훅입니다.
 * 스플래시 표시 여부와 App/Auth 네비게이터 분기 기준을 제공합니다.
 */
export function useAuthGate() {
  const [fbUser, setFbUser] = useState<FirebaseAuthTypes.User | null>(
    auth.currentUser,
  )
  const [isInitialAuthChecking, setIsInitialAuthChecking] = useState(
    !auth.currentUser?.uid,
  )

  const {data: userInfo} = useAppSelector(state => state.user)
  const {checkProfileAccess} = useAuthProfileGate()

  useEffect(() => {
    // 화면에 렌더링되어(마운트되어) 있는가?"** 를 추적하여
    // **안전하게 상태(State)를 업데이트하기 위한 플래그(Flag) 변수**입니다.
    let isEffectActive = true

    const unsubscribe = onAuthStateChanged(auth, user => {
      const handleAuthStateChange = async () => {
        logger.info('AuthGate: onAuthStateChanged fired', {
          uid: user?.uid ?? 'null',
        })
        if (!isEffectActive) return
        setFbUser(user)
        setIsInitialAuthChecking(false)

        if (!user?.uid) {
          analytics.identify(null)
          return
        }

        analytics.identify(user.uid)

        try {
          await checkProfileAccess(user.uid)
        } catch (err) {
          logger.error('AuthGate: profile access check failed unexpectedly', {
            uid: user.uid,
            errorMessage: err instanceof Error ? err.message : 'unknown',
          })
        } finally {
          if (isEffectActive) {
            setIsInitialAuthChecking(false)
          }
        }
      }

      handleAuthStateChange()
    })
    return () => {
      isEffectActive = false
      unsubscribe()
    }
  }, [checkProfileAccess])

  const hasAuthUser = !!fbUser?.uid
  const isUserInfoLoaded = !!userInfo?.uid
  const allowedStatuses = ['confirm', 'pending']

  /**
   * [ Snappy Logic ]
   * 1. Firebase 인증만 되어 있다면(hasAuthUser), 프로필 로드 전이라도 일단 앱 진입을 허용합니다.
   * 2. 이후 백그라운드에서 프로필 접근 검증에 실패하거나 차단된 유저임이 밝혀지면 로그아웃 처리되어 튕겨나갑니다.
   */
  const canEnterApp = hasAuthUser
  // 스플래시는 앱 최초 Firebase 인증 판정 전까지만 보여줍니다.
  const shouldShowSplash = isInitialAuthChecking

  useEffect(() => {
    if (shouldShowSplash) return
    // Analytics Logging 용도
    const reason = getAuthGateDecisionReason(
      canEnterApp,
      hasAuthUser,
      isUserInfoLoaded,
      userInfo?.accountStatus,
      allowedStatuses,
    )

    logAuthGateDecision({
      canEnterApp,
      reason,
      hasAuthUser,
      isUserInfoLoaded,
      accountStatus: userInfo?.accountStatus ?? 'none',
    })
  }, [
    canEnterApp,
    hasAuthUser,
    isUserInfoLoaded,
    shouldShowSplash,
    userInfo?.accountStatus,
  ])

  return {shouldShowSplash, canEnterApp}
}

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
  if (!allowedStatuses.includes(accountStatus ?? ''))
    return 'status_not_allowed'
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
