/**
 * [Redux Store 설정 파일]
 * Redux로 공유하는 클라이언트 상태를 관리합니다.
 *
 * [새로운 Slice 추가 방법]
 * 1. 새로운 슬라이스 파일(예: searchSlice.ts)을 만듭니다.
 * 2. 해당 파일의 reducer를 export default로 내보냅니다.
 * 3. 아래 configureStore의 'reducer' 객체 안에 추가합니다. (예: search: searchReducer)
 */
import {configureStore} from '@reduxjs/toolkit'
import timeReducer from './timeSlice'
import unreadReducer from './unreadCountSlice'
import userReducer from './userSlice'

// 1. 저장소(Store) 생성 및 설정
// - configureStore는 리듀서 통합, 미들웨어 설정, DevTools 연결을 자동으로 처리합니다.
const store = configureStore({
  reducer: {
    user: userReducer,         // 유저 정보 관리 칸
    time: timeReducer,         // 시간 정보 관리 칸
    unreadCount: unreadReducer, // 안 읽은 개수 관리 칸
  },
})

/**
 * [TypeScript 전용 타입 추출]
 * 이 두 줄은 스토어에서 자동으로 타입을 뽑아내어,
 * state와 dispatch 사용 시 타입 검사와 자동 완성을 지원합니다.
 */

// [설계도] 창고 전체의 데이터 구조 타입 (state.user, state.time 등이 들어있는 지도 역할)
export type RootState = ReturnType<typeof store.getState>

// [자격증] 주문서를 보내는 함수(dispatch)의 타입 (비동기 주문 등 모든 주문을 처리할 수 있는 권한)
export type AppDispatch = typeof store.dispatch

export default store
