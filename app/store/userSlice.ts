// app/store/userSlice.ts
import {userService} from '@app/features/user/service/userService'
import type {User} from '@app/shared/types/auth'
import {signOut} from '@react-native-firebase/auth'
import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit'
import {removeFCMTokenOnLogout} from '../services/userService'
import {auth} from '../shared/firebase/firestore'

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

// ✅ 비동기 thunk: Firebase에서 유저 불러오기
export const fetchUserById = createAsyncThunk(
  'user/fetchById',
  async (uid: string) => {
    if (!uid) throw new Error('Invalid UID')
    const user = await userService.getProfile(uid)
    return user as User
  },
)

export async function logout(dispatch?: any) {
  try {
    // 1) 토큰 제거 (권한이 살아 있을 때)
    await removeFCMTokenOnLogout()
  } finally {
    // 2) 앱 상태 정리 (스토어 초기화 등)
    dispatch?.(clearUser())

    // 3) 실제 로그아웃
    await signOut(auth)
  }
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
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
  extraReducers: builder => {
    builder
      .addCase(fetchUserById.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(
        fetchUserById.fulfilled,
        (state, action: PayloadAction<User>) => {
          state.loading = false
          state.data = action.payload
        },
      )
      .addCase(fetchUserById.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? 'Unknown error'
      })
  },
})

export const {clearUser, setUser} = userSlice.actions
export default userSlice.reducer
