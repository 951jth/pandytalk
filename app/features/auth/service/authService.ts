import {authRemote} from '@app/features/auth/data/authRemote.firebase'
import {messageLocal} from '@app/features/chat/data/messageLocal.sqlite'
import {fcmService} from '@app/features/notification/service/fcmService'
import {analytics} from '@app/shared/services/analytics'
import {createFirebaseAuthError} from '@app/shared/utils/logger'

export const authService = {
  login: async (
    email: string,
    password: string,
    source: string = 'login_screen',
  ) => {
    //나중에 로그인 로직 복잡해질 경우를 대비해서 서비스레이어로
    try {
      analytics.track('login_attempt', {source})
      const credential = await authRemote.signIn(email, password)
      analytics.track('login_success', {
        source,
        hasAuthUser: !!credential.user?.uid,
      })
      analytics.identify(credential.user?.uid ?? null)
    } catch (e) {
      analytics.track('login_failure', {
        source,
        errorCode:
          e && typeof e === 'object' && 'code' in e ? String(e.code) : 'unknown',
      })
      throw createFirebaseAuthError(e)
    }
  },

  logout: async (source: string = 'unknown') => {
    let fcmError: unknown = null

    analytics.track('logout_start', {source})

    try {
      await fcmService.removeFCMTokenOnLogout()
    } catch (e) {
      fcmError = e
      analytics.track('logout_failure', {
        source,
        phase: 'fcm_token_remove',
        errorMessage: e instanceof Error ? e.message : 'unknown',
      })
    }

    try {
      await messageLocal.clearAllMessages()
      await authRemote.signOut()
    } catch (e) {
      analytics.track('logout_failure', {
        source,
        phase: 'sign_out',
        errorMessage: e instanceof Error ? e.message : 'unknown',
      })
      throw e
    }

    analytics.track('logout_success', {
      source,
      hadFcmError: !!fcmError,
    })
    analytics.identify(null)

    if (fcmError) {
      throw fcmError
    }
  },
}
