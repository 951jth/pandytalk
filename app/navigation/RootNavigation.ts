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
import {analytics} from '@app/shared/services/analytics'
import {logger} from '@app/shared/services/logger'
import type {
  InitialChatInfo,
  RootStackParamList,
} from '@app/shared/types/navigate'
import {
  createNavigationContainerRef,
  StackActions,
} from '@react-navigation/native'
import BootSplash from 'react-native-bootsplash'

// 전역 내비게이션 참조 객체
export const navigationRef = createNavigationContainerRef<RootStackParamList>()

let isSplashFinished = false
const queue: Array<() => void> = []

const tryReleaseQueue = () => {
  console.log('navigationRef: ', navigationRef.isReady())
  console.log('isSplashFinished: ', isSplashFinished)
  console.log('queue: ', queue)
  if (navigationRef.isReady() && isSplashFinished) {
    // 내비게이션 준비와 스플래시 종료가 모두 완료되면 큐 해방
    BootSplash.hide({fade: true})
    while (queue.length) queue.shift()?.()
  }
}

/**
 * 스플래시 화면 종료 및 인증 분기가 완료되었을 때 호출되는 함수
 */
export const setIsSplashFinished = () => {
  isSplashFinished = true
  tryReleaseQueue()
}

/**
 * 내비게이션 컨테이너가 준비되었을 때 호출되는 핸들러
 * App.tsx의 <NavigationContainer onReady={onNavReady}> 에서 사용됨
 */
export const onNavReady = () => {
  tryReleaseQueue()
}

/**
 * 특정 채팅방으로 이동하는 함수
 * @param roomId 채팅방 ID
 * @param title 채팅방 제목 (상단 헤더용)
 * @param chatType 'group' 또는 'dm'
 * @param targetId DM일 경우 상대방 사용자 ID
 */
export function navigateToChat(initialChatInfo: InitialChatInfo) {
  // 1. [Analytics + Logger] 진입 시도 기록
  analytics.track('nav_chat_attempt', {
    type: initialChatInfo.type,
    roomId: initialChatInfo.id,
  })
  logger.info('navigateToChat Attempt', {
    roomId: initialChatInfo.id,
    isSplashFinished,
    isRefReady: navigationRef.isReady(),
    currentRoute: navigationRef.isReady()
      ? navigationRef.getCurrentRoute()?.name
      : 'unknown',
  })

  const task = () => {
    try {
      logger.info('navigateToChat Executing Task')

      /**
       * [dispatch vs navigate]
       * - navigate(): 동일 화면이면 이동하지 않고 파라미터만 바꾸려 함 (가끔 무시됨)
       * - dispatch(): 내비게이션 상태 머신에 직접 '명령(Action)'을 투척함
       *
       * [StackActions.push]
       * - "이전 화면이 무엇이든 상관없이" 새로운 채팅방 화면을 현재 스택 맨 위에 강제로 얹습니다.
       * - 사용자가 이미 다른 그룹 채팅방에 있더라도, 푸시를 누르면 새로운 방 화면이 위로 뜹니다.
       */
      const currentRouteName = navigationRef.isReady()
        ? navigationRef.getCurrentRoute()?.name
        : null

      const isChatScreen =
        currentRouteName === 'group-chat' || currentRouteName === 'dm-chat'

      if (initialChatInfo.type === 'group') {
        if (isChatScreen) {
          // 현재 이미 채팅방을 보고 있다면 새 스택을 쌓지 않고 기존 화면을 '교체(replace)'
          navigationRef.dispatch(
            StackActions.replace('group-chat', {initialChatInfo}),
          )
        } else {
          // 홈이나 다른 화면이라면 자연스럽게 '위로 이동(navigate)'
          navigationRef.navigate('app', {
            screen: 'group-chat',
            params: {initialChatInfo},
          })
        }
      } else {
        if (isChatScreen) {
          navigationRef.dispatch(
            StackActions.replace('dm-chat', {initialChatInfo}),
          )
        } else {
          navigationRef.navigate('app', {
            screen: 'dm-chat',
            params: {initialChatInfo},
          })
        }
      }

      // 2. [Analytics + Logger] 네비게이션 성공 기록
      analytics.track('nav_chat_success', {roomId: initialChatInfo.id})
      logger.info('navigateToChat Succeeded')
    } catch (error) {
      // 3. [Crashlytics + Analytics] 치명적 오류 발생 시 에러 수집
      analytics.track('nav_chat_failed', {
        roomId: initialChatInfo.id,
        errorMsg: error instanceof Error ? error.message : String(error),
      })
      logger.error('navigateToChat Failed internally', error)
    }
  }

  if (!initialChatInfo.id) {
    logger.warn('navigateToChat Aborted: No chatId provided')
    return console.warn('❗ chatId is required.')
  }

  // 4. [Logger] 큐에 들어가는 상황(콜드스타트 등) 기록
  if (!navigationRef.isReady() || !isSplashFinished) {
    logger.info('navigateToChat Queued (Waiting for App Setup)')
    queue.push(task)
    return
  }

  // 준비되었다면 즉시 실행
  task()
}

/**
 * 일반적인 페이지 이동 함수 (단순 이동용)
 */
export function navigateByPush(routeName: 'users') {
  const task = () => {
    navigationRef.navigate('app', {
      screen: 'main',
      params: {screen: routeName},
    })
  }
  if (!navigationRef.isReady() || !isSplashFinished) {
    queue.push(task)
    return
  }
  task()
}
