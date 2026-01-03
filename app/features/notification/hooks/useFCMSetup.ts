import {notificationService} from '@app/features/notification/service/notificationService'
import {auth} from '@app/shared/firebase/firestore'
import {
  onAuthStateChanged,
  type FirebaseAuthTypes,
} from '@react-native-firebase/auth'
import {useEffect, useState} from 'react'

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
        //추후 관리자 승인시 푸쉬알림 처리를 할 것 떄문이기에 계정에 등록해둠
        notificationService.registerDevice(user?.uid)
      } catch (e) {
        console.error('useFCMSetup', e)
      }
    })()
  }, [user])
}
