// app/store/store.ts
import {configureStore} from '@reduxjs/toolkit'
import timeReducer from './timeSlice' // ✅ default export → 이름 자유롭게 지정 가능
import unreadReducer from './unreadCountSlice'
import userReducer from './userSlice'

const store = configureStore({
  reducer: {
    user: userReducer,
    time: timeReducer, // ✅ time slice 등록
    unreadCount: unreadReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export default store
