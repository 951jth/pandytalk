import {useQueryClient} from '@tanstack/react-query'
import {Alert} from 'react-native'
import {initChatTables, resetMessagesSchema} from '../../db/sqlite'

export const useResetAllQueryCache = () => {
  const queryClient = useQueryClient()

  const resetAll = async () => {
    try {
      console.log('🧹 Resetting all local storage and cache...')
      // await clearAllMessagesFromSQLite() // 1. SQLite 삭제
      await resetMessagesSchema()
      initChatTables()
      queryClient.clear() // 2. React Query 모든 캐시 삭제
      Alert.alert('캐시 초기화 완료')
    } catch (e) {
      console.log('❌ Error during full reset:', e)
    }
  }

  return {resetAll}
}
