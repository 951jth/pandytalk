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
    // if(chatType == 'group'){

    // }else {

    // }
    if (chatType == 'group') {
      console.log('roomId: ', roomId)
      console.log('title: ', title)
      console.log('chatType: ', chatType)
      // 1뎁스
      navigationRef.navigate('app', {
        screen: 'group-chat',
        params: {roomId},
      })
    } else {
      // 1뎁스
      navigationRef.navigate('app', {
        screen: 'chatRoom',
        params: {roomId, title},
      })
    }
  }

  if (!roomId) return console.warn('❗ roomId is required.')

  if (!navigationRef.isReady() || !ready) {
    queue.push(task)
    return
  }
  task()
}
