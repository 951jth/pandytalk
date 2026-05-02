import {auth} from '@app/shared/firebase/firestore'
import {useLogout} from '@app/shared/hooks/useLogout'
import {logger} from '@app/shared/services/logger'
import type {User} from '@app/shared/types/auth'
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
  const [verifiedAccountStatus, setVerifiedAccountStatus] = useState<
    User['accountStatus'] | 'stop' | null
  >(null)

  const dispatch = useDispatch<AppDispatch>()
  const {data: userInfo} = useAppSelector(state => state.user)
  const {logout} = useLogout()

  const fetchProfile = useCallback(
    async (uid: string) => {
      const profile = await dispatch(fetchUserById(uid)).unwrap()
      logger.info('AuthGate profile fetch result', {
        uid,
        hasProfile: !!profile?.uid,
        accountStatus: profile?.accountStatus ?? 'missing',
      })

      if (!profile?.uid) {
        logger.warn('AuthGate cannot enter app because user profile is missing', {
          uid,
        })
        return null
      }

      const blockedStatuses = ['reject', 'stop']
      if (blockedStatuses.includes(profile?.accountStatus)) {
        logger.warn('AuthGate logging out blocked user', {
          uid,
          accountStatus: profile.accountStatus,
        })
        await logout()
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
    let authStateVersion = 0

    const unsubscribe = onAuthStateChanged(auth, user => {
      authStateVersion += 1
      const currentVersion = authStateVersion

      void (async () => {
        logger.info('AuthGate Firebase auth state changed', {
          hasUser: !!user?.uid,
          uid: user?.uid ?? 'none',
          email: user?.email ?? 'none',
        })
        setInitializing(true)
        setFbUser(user)
        setVerifiedAccountStatus(null)

        if (!user?.uid) {
          logger.warn(
            'AuthGate resolved to login because Firebase auth user is null',
          )
          setInitializing(false)
          return
        }

        try {
          const profile = await fetchProfile(user.uid)
          if (currentVersion === authStateVersion) {
            setVerifiedAccountStatus(profile?.accountStatus ?? null)
          }
        } catch (err) {
          logger.error('AuthGate profile fetch failed', err)
        } finally {
          if (currentVersion === authStateVersion) {
            setInitializing(false)
          }
        }
      })()
    })
    return unsubscribe
  }, [fetchProfile])

  //스플래시 스크린은 마운트 될떄만 뜨도록 설정함(isMounted)
  const shouldShowSplash = initializing

  const allowedStatuses = ['confirm', 'pending']
  const accountStatus = verifiedAccountStatus ?? userInfo?.accountStatus ?? ''
  const canEnterApp =
    !!fbUser?.uid && allowedStatuses.includes(accountStatus)

  return {shouldShowSplash, canEnterApp}
}
