import {auth} from '@app/shared/firebase/firestore'
import {useLogout} from '@app/shared/hooks/useLogout'
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

export function useAuthGate() {
  const [fbUser, setFbUser] = useState<FirebaseAuthTypes.User | null>(null)
  const [initializing, setInitializing] = useState(true) //앱이 로드 되었는지 유무

  const dispatch = useDispatch<AppDispatch>()
  const {data: userInfo, loading} = useAppSelector(state => state.user)
  const {logout} = useLogout()

  const fetchProfile = useCallback(
    async (uid: string) => {
      const profile = await dispatch(fetchUserById(uid)).unwrap()
      const blockedStatuses = ['reject', 'stop']
      if (blockedStatuses.includes(profile?.accountStatus)) {
        logout()
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
    const unsubscribe = onAuthStateChanged(auth, user => {
      ;(async () => {
        setFbUser(user)
        if (!user?.uid) {
          setInitializing(false)
          return
        }

        try {
          await fetchProfile(user.uid)
        } catch (err) {
          console.log('❌ 유저 정보 로딩 실패:', err)
        } finally {
          setInitializing(false)
        }
      })()
    })
    return unsubscribe
  }, [fetchProfile])

  //스플래시 스크린은 마운트 될떄만 뜨도록 설정함(isMounted)
  const shouldShowSplash = initializing

  const allowedStatuses = ['confirm', 'pending']
  const canEnterApp =
    !!fbUser?.uid && allowedStatuses.includes(userInfo?.accountStatus ?? '')

  return {shouldShowSplash, canEnterApp}
}
