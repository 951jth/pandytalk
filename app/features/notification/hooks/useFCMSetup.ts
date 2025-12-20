import {notificationService} from '@app/features/notification/service/notificationService'
import {auth} from '@app/shared/firebase/firestore'
import {isNewUser} from '@app/shared/utils/firebase'
import {
  onAuthStateChanged,
  type FirebaseAuthTypes,
} from '@react-native-firebase/auth'
import {useEffect, useState} from 'react'

// iOS 권한 : alert, badge, sound, provisional 선택 가능
const iosPermOptions = {
  alert: true,
  badge: true,
  sound: true,
  provisional: false,
}

const AuthorizationStatus = {
  NOT_DETERMINED: 1,
  DENIED: 2,
  AUTHORIZED: 3,
  PROVISIONAL: 4,
}

export function useFCMSetup() {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(
    auth.currentUser,
  )

  // 1) Auth 변화 구독: 로그인/로그아웃/재로그인 모두 잡음
  useEffect(() => {
    const unsub = onAuthStateChanged(
      auth,
      (user: FirebaseAuthTypes.User | null) => {
        setUser(user)
      },
    )
    return unsub
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        if (user?.uid && !isNewUser(user))
          notificationService.registerDevice(user?.uid)
      } catch (e) {
        console.error('useFCMSetup', e)
      }
    })()
  }, [user])
}
