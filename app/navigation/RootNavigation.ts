import {createNavigationContainerRef} from '@react-navigation/native'
import BootSplash from 'react-native-bootsplash'

export const navigationRef = createNavigationContainerRef<any>()

let ready = false
const queue: Array<() => void> = []

export const onNavReady = () => {
  ready = true
  // 네비게이션 준비되면 스플래시 숨기기
  BootSplash.hide({fade: true})

  while (queue.length) queue.shift()?.()
}

export function navigateToChat(
  roomId: string,
  title?: string,
  chatType?: string,
) {
  const task = () => {
    const screenName = chatType === 'group' ? 'group-chat' : 'dm-chat'

    navigationRef.navigate('app', {
      screen: screenName,
      params: {roomId, title},
      // 동일한 스크린명이라도 roomId가 다르면 새로운 인스턴스로 인식하거나 
      // 파라미터를 강제 갱신하도록 key를 roomId로 설정
      key: `${screenName}-${roomId}`,
    })
  }

  if (!roomId) return console.warn('❗ roomId is required.')

  if (!navigationRef.isReady() || !ready) {
    queue.push(task)
    return
  }
  task()
}

export function navigateByPush(routeName: string, params?: object) {
  const task = () => {
    navigationRef.navigate(routeName, params)
  }
  if (!navigationRef.isReady() || !ready) {
    queue.push(task)
    return
  }
  task()
}
