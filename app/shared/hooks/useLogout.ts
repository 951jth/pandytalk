import {authService} from '@app/features/auth/service/authService'
import type {AppDispatch} from '@app/store/store'
import {clearUser} from '@app/store/userSlice'
import {useDispatch} from 'react-redux'

//기능이 추가될 가능성이 있어서 공통 훅으로뺌
export const useLogout = () => {
  const dispatch = useDispatch<AppDispatch>()
  const logout = async () => {
    try {
      await authService.logout()
      dispatch?.(clearUser())
      // 필요시 로그인 화면으로 리디렉션
    } catch (e) {
      console.log('로그아웃 실패:', e)
    }
  }
  return {logout}
}
