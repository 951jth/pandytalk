/**
 * RootNavigation.ts
 *
 * [목적]
 * 이 파일은 React 컴포넌트 외부(Service, FCM Listener, Axios Interceptor 등)에서
 * 앱의 내비게이션을 제어하기 위한 "Global Navigation Reference"를 관리합니다.
 *
 * [동작 원리]
 * 1. createNavigationContainerRef를 통해 전역 참조 객체(navigationRef)를 생성합니다.
 * 2. App.tsx의 <NavigationContainer ref={navigationRef}>에 이 참조를 연결합니다.
 * 3. 앱이 준비되기 전(ready === false)에 들어온 요청은 queue에 담아두었다가,
 *    onNavReady가 실행되는 시점에 순차적으로 처리합니다.
 */
import {
  createNavigationContainerRef,
  StackActions,
} from '@react-navigation/native'
import BootSplash from 'react-native-bootsplash'

// 전역 내비게이션 참조 객체
export const navigationRef = createNavigationContainerRef<any>()

let ready = false
const queue: Array<() => void> = []

/**
 * 내비게이션 컨테이너가 준비되었을 때 호출되는 핸들러
 * App.tsx의 <NavigationContainer onReady={onNavReady}> 에서 사용됨
 */
export const onNavReady = () => {
  ready = true
  // 내비게이션 준비되면 스플래시 화면 숨기기
  BootSplash.hide({fade: true})

  // 대기 중이던 내비게이션 작업 수행
  while (queue.length) queue.shift()?.()
}

/**
 * 특정 채팅방으로 이동하는 함수
 * @param roomId 채팅방 ID
 * @param title 채팅방 제목 (상단 헤더용)
 * @param chatType 'group' 또는 'dm'
 * @param targetId DM일 경우 상대방 사용자 ID
 */
export function navigateToChat(
  roomId: string,
  title?: string,
  chatType?: string,
  targetId?: string,
) {
  const task = () => {
    // 채팅 타입에 따라 스크린 결정
    const screenName = chatType === 'group' ? 'group-chat' : 'dm-chat'

    /**
     * [dispatch vs navigate]
     * - navigate(): 동일 화면이면 이동하지 않고 파라미터만 바꾸려 함 (가끔 무시됨)
     * - dispatch(): 내비게이션 상태 머신에 직접 '명령(Action)'을 투척함
     *
     * [StackActions.push]
     * - "이전 화면이 무엇이든 상관없이" 새로운 채팅방 화면을 현재 스택 맨 위에 강제로 얹습니다.
     * - 사용자가 이미 다른 그룹 채팅방에 있더라도, 푸시를 누르면 새로운 방 화면이 위로 뜹니다.
     */
    navigationRef.dispatch(
      StackActions.replace(screenName, {
        roomId,
        title,
        targetId,
      }),
    )
  }

  if (!roomId) return console.warn('❗ roomId is required.')

  // 내비게이션이 아직 준비되지 않았다면 큐에 저장 후 리턴
  if (!navigationRef.isReady() || !ready) {
    queue.push(task)
    return
  }

  // 준비되었다면 즉시 실행
  task()
}

/**
 * 일반적인 페이지 이동 함수 (단순 이동용)
 */
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
