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
 * 3. NavigationContainer가 준비되기 전, 또는 RootStack이 app 화면을 렌더링하기 전
 *    들어온 요청은 queue에 담아두었다가 두 조건이 모두 충족된 뒤 순차적으로 처리합니다.
 *
 * [왜 appReady를 따로 보나?]
 * NavigationContainer의 onReady는 "컨테이너가 준비됨"만 의미합니다.
 * 콜드스타트에서는 FCM 초기 알림이 도착한 시점에 컨테이너는 준비됐지만,
 * RootNavigator가 아직 splash/auth 상태라 app 라우트가 없는 순간이 생길 수 있습니다.
 * 이때 navigate('app', ...)를 바로 실행하면 액션이 무시될 수 있어 appReady까지 확인합니다.
 */
import {
  createNavigationContainerRef,
  StackActions,
} from '@react-navigation/native'
import type {
  AppRouteParamList,
  InitialChatInfo,
  RootStackParamList,
} from '@app/shared/types/navigate'
import BootSplash from 'react-native-bootsplash'

// 전역 내비게이션 참조 객체
export const navigationRef = createNavigationContainerRef<RootStackParamList>()

// NavigationContainer 자체의 준비 여부입니다. AppStack이 열렸다는 뜻은 아닙니다.
let containerReady = false

// RootNavigator가 app 라우트를 렌더링할 수 있는 상태인지 나타냅니다.
let appReady = false

// FCM, 서비스, 인터셉터처럼 React 컴포넌트 바깥에서 들어온 네비게이션 요청을 보관합니다.
const queue: Array<() => void> = []

/**
 * 지금 전역 네비게이션 요청을 실행해도 되는지 확인합니다.
 *
 * navigationRef.isReady()/containerReady만으로는 콜드스타트 푸시 진입을 보장하기 어렵습니다.
 * appReady와 AppStack key까지 있어야 dm-chat/group-chat을 소유한 내부 Stack에 직접 push할 수 있습니다.
 */
function canRunNavigationTask() {
  return navigationRef.isReady() && containerReady && appReady && !!getAppStackKey()
}

/**
 * 대기 중인 네비게이션 요청을 실행합니다.
 *
 * onNavReady와 setAppNavigationReady 양쪽에서 호출됩니다.
 * 두 ready 조건이 모두 충족되기 전에는 아무것도 하지 않아, 너무 이른 flush를 막습니다.
 */
function flushQueue() {
  if (!canRunNavigationTask()) return

  while (queue.length) queue.shift()?.()
}

/**
 * 네비게이션 요청을 즉시 실행하거나, 아직 이르면 queue에 저장합니다.
 *
 * 호출자는 FCM인지 일반 서비스인지 신경 쓰지 않아도 됩니다.
 * 실행 가능 시점 판단을 이 함수로 모아 중복 조건과 콜드스타트 타이밍 버그를 줄입니다.
 */
function enqueueOrRun(task: () => void) {
  if (!canRunNavigationTask()) {
    queue.push(task)
    return
  }

  task()
}

/**
 * RootStack 안에 중첩된 AppStack의 navigation state key를 찾습니다.
 *
 * RootNavigation은 RootStack 바깥에서 호출되기 때문에,
 * navigationRef.navigate('app', {screen: 'dm-chat'})처럼 부모 route를 통해 우회하면
 * 이미 app route가 열려 있는 상황에서 내부 Stack 이동이 안정적으로 반영되지 않을 수 있습니다.
 * AppStack key를 찾으면 StackActions.push를 해당 child navigator에 직접 보낼 수 있습니다.
 */
function getAppStackKey() {
  const rootState = navigationRef.getRootState()
  const appRoute = rootState.routes.find(route => route.name === 'app')
  return appRoute?.state?.key
}

/**
 * AppStack 내부 화면으로 직접 push합니다.
 *
 * 채팅 푸시처럼 "목록 위에 채팅방을 올려야 하는" 이동은 부모 app route로 navigate하지 않고,
 * 실제 dm-chat/group-chat을 소유한 AppStack에 StackActions.push를 보냅니다.
 */
function pushToAppStack<RouteName extends keyof AppRouteParamList>(
  routeName: RouteName,
  params: AppRouteParamList[RouteName],
) {
  const appStackKey = getAppStackKey()

  if (appStackKey) {
    navigationRef.dispatch({
      ...StackActions.push(routeName, params),
      target: appStackKey,
    })
  }
}

/**
 * 내비게이션 컨테이너가 준비되었을 때 호출되는 핸들러
 * App.tsx의 <NavigationContainer onReady={onNavReady}> 에서 사용됨
 *
 * 여기서는 containerReady만 true로 둡니다.
 * RootNavigator가 아직 splash/auth를 보여주는 동안에는 app 라우트가 없을 수 있어,
 * queue는 setAppNavigationReady(true)가 호출된 뒤에 실제로 비워질 수 있습니다.
 */
export const onNavReady = () => {
  containerReady = true
  // 내비게이션 준비되면 스플래시 화면 숨기기
  BootSplash.hide({fade: true})

  // 대기 중이던 내비게이션 작업 수행
  flushQueue()
}

/**
 * RootStack에 app 라우트가 실제로 렌더링 가능한 상태인지 알려주는 핸들러.
 * NavigationContainer ready와 앱 진입 가능 상태는 콜드스타트에서 서로 다른 타이밍에 도달할 수 있습니다.
 *
 * RootNavigator에서 target이 app이면 true, splash/auth이면 false를 넘깁니다.
 * 로그아웃 등으로 auth로 돌아간 뒤 들어온 외부 네비게이션이 app으로 잘못 실행되는 것도 막습니다.
 */
export const setAppNavigationReady = (isReady: boolean) => {
  appReady = isReady
  flushQueue()
}

/**
 * 특정 채팅방으로 이동하는 함수
 * @param roomId 채팅방 ID
 * @param title 채팅방 제목 (상단 헤더용)
 * @param chatType 'group' 또는 'dm'
 * @param targetId DM일 경우 상대방 사용자 ID
 */
export function navigateToChat(
  initialChatInfo: InitialChatInfo,
) {
  const task = () => {
    /**
     * RootStack의 app 내부에 있는 채팅 화면으로 nested navigation을 실행합니다.
     * 콜드스타트에서는 이 task가 queue에 보관됐다가 appReady 이후 실행될 수 있습니다.
     */
    if (initialChatInfo.type === 'group') {
      pushToAppStack('group-chat', {initialChatInfo})
      return
    }

    pushToAppStack('dm-chat', {initialChatInfo})
  }

  if (!initialChatInfo.id) return console.warn('❗ chatId is required.')

  enqueueOrRun(task)
}

/**
 * 일반적인 페이지 이동 함수 (단순 이동용)
 *
 * 현재는 가입 승인 등에서 users 탭으로 보내는 용도로 사용합니다.
 * 채팅 이동과 동일하게 appReady 전 요청은 queue에 넣어 콜드스타트 타이밍을 맞춥니다.
 */
export function navigateByPush(routeName: 'users') {
  const task = () => {
    navigationRef.navigate('app', {
      screen: 'main',
      params: {screen: routeName},
    })
  }
  enqueueOrRun(task)
}
