import {createNavigationContainerRef} from '@react-navigation/native'

export const navigationRef = createNavigationContainerRef<any>()

let ready = false
const queue: Array<() => void> = []

export const onNavReady = () => {
  ready = true
  while (queue.length) queue.shift()?.()
}

export function navigateToChat(roomId: string, title?: string) {
  const task = () => {
    // 1뎁스
    navigationRef.navigate('app', {
      screen: 'chatRoom',
      params: {roomId, title},
    })
  }

  if (!roomId) return console.warn('❗ roomId is required.')

  if (!navigationRef.isReady() || !ready) {
    queue.push(task)
    return
  }
  task()
}
