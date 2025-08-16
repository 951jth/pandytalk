import {createNavigationContainerRef} from '@react-navigation/native'

export const navigationRef = createNavigationContainerRef<any>()

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
  }) // ✅ 타입 강제 만족
}
