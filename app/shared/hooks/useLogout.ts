import {authService} from '@app/features/auth/service/authService'
import type {AppDispatch} from '@app/store/store'
import {clearUser} from '@app/store/userSlice'
import {useQueryClient} from '@tanstack/react-query'
import {useCallback} from 'react'
import {Alert} from 'react-native'
import {useDispatch} from 'react-redux'

//기능이 추가될 가능성이 있어서 공통 훅으로뺌
export const useLogout = () => {
  const queryClient = useQueryClient()
  const dispatch = useDispatch<AppDispatch>()
  const logout = useCallback(async (source: string = 'use_logout') => {
    try {
      await authService.logout(source)
      queryClient.clear()
      dispatch?.(clearUser())
      // 필요시 로그인 화면으로 리디렉션
    } catch (e) {
      console.log('로그아웃 실패:', e)
    }
  }, [dispatch, queryClient])

  const confirmLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃할까요?',
      [
        {text: '취소', style: 'cancel'},
        {text: '로그아웃', style: 'destructive', onPress: logout},
      ],
      {cancelable: true},
    )
  }
  return {logout, confirmLogout}
}
