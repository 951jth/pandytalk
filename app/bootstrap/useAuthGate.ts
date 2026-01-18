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
  // - 스플래시 스크린이 실제 페이지가 마운트될 때만 뜨도록 하기 위함.
  // - 기존에는 로그인 시도시에 강제로 스플래시 스크린이 떴엇는데, 이걸 방지.

  // 1. 앱 시작 → onAuthStateChanged 콜백 호출됨 (fbUser 있음)
  // 2. fetchProfile 시작 -> 프로필 결과가 confirm이 아님 → logout() 호출됨
  // → 이 순간 auth 상태가 바뀌면서 루트가 바뀌거나, onAuthStateChanged가 다시 들어옴
  // 3. 그런데 fetchProfile는 updateLastSeen 같은 await 흐름 때문에 아직 끝나기 전/끝난 직후일 수 있음
  // → 늦게 도착한 finally에서 setInitializing(false)를 치려는 순간, 이미 해당 훅을 쓰는 컴포넌트가 교체/언마운트 됐을 수 있음
  // → 그걸 막는 게 mountedRef 체크
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
