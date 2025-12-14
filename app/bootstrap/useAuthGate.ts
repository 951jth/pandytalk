import {updateLastSeen} from '@app/services/userService'
import {auth} from '@app/shared/firebase/firestore'
import {useAppSelector} from '@app/store/reduxHooks'
import type {AppDispatch} from '@app/store/store'
import {clearUser, fetchUserById} from '@app/store/userSlice'
import {
  onAuthStateChanged,
  type FirebaseAuthTypes,
} from '@react-native-firebase/auth'
import {useEffect, useState} from 'react'
import {Alert} from 'react-native'
import {useDispatch} from 'react-redux'

export function useAuthGate() {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null)
  const dispatch = useDispatch<AppDispatch>()
  const [initializing, setInitializing] = useState<boolean>(true) //앱의 자바스크립트가 붙어야함.
  const {data: userInfo, loading} = useAppSelector(state => state.user)

  const fetchProfile = async (uid: string) => {
    try {
      const profile = await dispatch(fetchUserById(uid)).unwrap()
      if (profile?.accountStatus !== 'confirm') {
        Alert.alert(
          '승인 대기 중',
          '회원님의 가입 신청이 아직 승인되지 않았습니다.\n관리자가 확인 후 승인이 완료되면 다시 이용하실 수 있습니다.',
        )
        // 승인된 경우도 실패흡수
        try {
          await updateLastSeen(uid)
        } catch (e) {
          console.warn(e)
        }
      }
    } catch (err) {
      console.log('❌ 유저 정보 로딩 실패:', err)
    }
  }
  // FB Auth 상태 감시
  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, fbUser => {
      setUser(fbUser)
      if (fbUser?.uid) {
        fetchProfile(fbUser.uid)
      } else {
        dispatch(clearUser()) // 로그아웃 or 비인증
      }
    })
    if (initializing) setInitializing(false)
    return subscriber
  }, [dispatch])

  const shouldShowSplash = initializing || (loading && !userInfo)
  const canEnterApp = !user && userInfo?.accountStatus === 'confirm'

  return {shouldShowSplash, canEnterApp}
}
