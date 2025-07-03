import {createNavigationContainerRef} from '@react-navigation/native'
import {RootStackParamList} from '../../types/navigate'

export const navigationRef = createNavigationContainerRef<RootStackParamList>()

export function navigateToChat(roomId: string, title?: string) {
  if (!navigationRef.isReady() && !roomId && !title) {
    console.warn('❗ navigationRef is not ready yet.')
    return
  }

  navigationRef.navigate('app', {
    screen: 'chatRoom',
    params: {
      roomId,
      title,
    },
  } satisfies RootStackParamList['app']) // ✅ 타입 강제 만족
}
