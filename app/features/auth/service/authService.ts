import {authRemote} from '@app/features/auth/data/authRemote.firebase'
import {fcmService} from '@app/features/notification/service/fcmService'
import {handleFirebaseAuthError} from '@app/shared/utils/logger'

export const authService = {
  login: async (email: string, password: string) => {
    //나중에 로그인 로직 복잡해질 경우를 대비해서 서비스레이어로
    try {
      await authRemote.signIn(email, password)
    } catch (e) {
      throw handleFirebaseAuthError(e)
    }
  },

  logout: async () => {
    try {
      await fcmService.removeFCMTokenOnLogout()
    } finally {
      await authRemote.signOut()
    }
  },
}
