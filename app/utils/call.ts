import {InteractionManager} from 'react-native'

export const safeCall = (fn: () => Promise<any>) => {
  InteractionManager.runAfterInteractions(() => {
    Promise.resolve()
      .then(fn)
      .catch(err => {
        console.warn('[presence]', err) // 반드시 흡수
      })
  })
}
