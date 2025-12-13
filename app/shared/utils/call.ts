import {InteractionManager} from 'react-native'

export const safeCall = (fn: () => Promise<any>) => {
  //현재 진행 중인 제스처, 애니메이션, 네비게이션 트랜지션 등이 끝난
  // 이후에 콜백을 실행해 주는 React Native 유틸
  InteractionManager.runAfterInteractions(() => {
    Promise.resolve()
      .then(fn)
      .catch(err => {
        //로직이 실패해도 에러메세지만 뜨고 넘어감, 크래시 방어
        console.warn('[presence]', err) // 반드시 흡수
      })
  })
}
