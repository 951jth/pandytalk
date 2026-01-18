import {userService} from '@app/features/user/service/userService'
import {auth} from '@app/shared/firebase/firestore'
import {useLogout} from '@app/shared/hooks/useLogout'
import {useAppSelector} from '@app/store/reduxHooks'
import type {AppDispatch} from '@app/store/store'
import {fetchUserById} from '@app/store/userSlice'
import {
  onAuthStateChanged,
  type FirebaseAuthTypes,
} from '@react-native-firebase/auth'
import {useCallback, useEffect, useRef, useState} from 'react'
import {Alert} from 'react-native'
import {useDispatch} from 'react-redux'

export function useAuthGate() {
  const [fbUser, setFbUser] = useState<FirebaseAuthTypes.User | null>(null)
  const [initializing, setInitializing] = useState(true) //앱이 로드 되었는지 유무

  const dispatch = useDispatch<AppDispatch>()
  const {data: userInfo, loading} = useAppSelector(state => state.user)
  const {logout} = useLogout()
  // 왜 mountedRef를 쓰는가?
  // 1. 단순 경고 무시 목적보다는, 비동기 로직이 완료된 시점에 사용자가 이미 화면을 벗어나면
  //  굳이 loading 상태를 끄거나 화면을 전환하는 로직을 실행할 필요가 없기 때문.
  // 2. 혹시 모를 setInitializing로 인한 사이드이펙트로 인해 이전화면에서의 navigation 요청이 무시되는것을 다시 막기위함.(이미 RootApp에서 한번막지만)

  const mountedRef = useRef(true)

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const fetchProfile = useCallback(
    async (uid: string) => {
      const profile = await dispatch(fetchUserById(uid)).unwrap()
      await userService.updateLastSeen(uid)

      if (profile?.accountStatus !== 'confirm') {
        logout()
        Alert.alert(
          '승인 대기 중',
          '회원님의 가입 신청이 아직 승인되지 않았습니다.\n관리자가 확인 후 승인이 완료되면 다시 이용하실 수 있습니다.',
        )
        return null
      }

      return profile
    },
    [dispatch, logout],
  )

  useEffect(() => {
    mountedRef.current = true
    const unsubscribe = onAuthStateChanged(auth, user => {
      ;(async () => {
        setFbUser(user)
        if (!user?.uid) {
          if (mountedRef.current) setInitializing(false)
          return
        }

        try {
          await fetchProfile(user.uid)
        } catch (err) {
          console.log('❌ 유저 정보 로딩 실패:', err)
        } finally {
          if (mountedRef.current) setInitializing(false)
        }
      })()
    })

    return unsubscribe
  }, [fetchProfile])

  //스플래시 스크린은 마운트 될떄만 뜨도록 설정함(isMounted)
  const shouldShowSplash = initializing

  const canEnterApp = !!fbUser?.uid && userInfo?.accountStatus === 'confirm'

  return {shouldShowSplash, canEnterApp}
}
