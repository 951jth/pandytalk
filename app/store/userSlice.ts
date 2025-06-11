// app/store/userSlice.ts
import {doc, getDoc, getFirestore} from '@react-native-firebase/firestore'
import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit'
import {User} from '../types/firebase'

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
    const firestore = getFirestore()
    const docRef = doc(firestore, 'users', uid)
    const snapshot = await getDoc(docRef)
    if (!snapshot.exists()) throw new Error('User not found')
    const data = snapshot.data()
    return {
      ...data,
      lastSeen: data?.lastSeen,
    } as User
  },
)

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
