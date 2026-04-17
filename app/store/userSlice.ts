// app/store/userSlice.ts
import {userService} from '@app/features/user/service/userService'
import type {User} from '@app/shared/types/auth'
import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit'

type UserState = {
  data: User | null
  loading: boolean
  error: string | null
}

const initialState: UserState = {
  data: null,
  loading: false,
  error: null,
}

// ✅ [Step 1] 비동기 thunk 정의: "외부(Firebase)에서 데이터를 가져오는 주문서"
// - createAsyncThunk('액션이름', 비동기함수) 형태로 만듭니다.
export const fetchUserById = createAsyncThunk(
  'user/fetchById',
  async (uid: string) => {
    if (!uid) throw new Error('Invalid UID')
    const user = await userService.getProfile(uid)
    return user as User // 여기서 리턴된 값은 'fulfilled'의 action.payload가 됩니다.
  },
)

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // [동기적인 변경]: 창고 안에서 바로 해결되는 주문들
    setUser: (state, action: PayloadAction<User>) => {
      state.data = action.payload
      state.loading = false
      state.error = null
    },
    clearUser: state => {
      state.data = null
      state.loading = false
      state.error = null
    },
  },
  // ✅ [Step 2] extraReducers: "비동기 주문(Thunk)의 진행 상황별 처리"
  extraReducers: builder => {
    builder
      // 1. 대기 중 (pending): "주문서를 넣고 응답을 기다리는 중" -> 로딩 스피너 등을 띄울 때 사용
      .addCase(fetchUserById.pending, state => {
        state.loading = true
        state.error = null
      })
      // 2. 성공 (fulfilled): "데이터가 무사히 도착함" -> 창고에 데이터 저장
      .addCase(
        fetchUserById.fulfilled,
        (state, action: PayloadAction<User>) => {
          state.loading = false
          state.data = action.payload
        },
      )
      // 3. 실패 (rejected): "네트워크 에러 등 문제가 생김" -> 에러 메시지 저장
      .addCase(fetchUserById.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? 'Unknown error'
      })
  },
})

export const {clearUser, setUser} = userSlice.actions
export default userSlice.reducer
