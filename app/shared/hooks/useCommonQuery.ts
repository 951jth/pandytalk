import {messageLocal} from '@app/features/chat/data/messageLocal.sqlite'
import {useQueryClient} from '@tanstack/react-query'
import {Alert} from 'react-native'

export const useResetAllQueryCache = () => {
  const queryClient = useQueryClient()

  const resetAll = async () => {
    try {
      console.log('🧹 Resetting all local storage and cache...')
      await messageLocal.clearAllMessages() // 1. SQLite 메시지 테이블 초기화
      queryClient.clear() // 2. React Query 모든 캐시 삭제
      Alert.alert('캐시 초기화 완료')
    } catch (e) {
      console.log('❌ Error during full reset:', e)
    }
  }

  return {resetAll}
}
