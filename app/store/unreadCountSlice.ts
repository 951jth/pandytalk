// store/slices/unreadCountSlice.ts
import {createSlice, type PayloadAction} from '@reduxjs/toolkit'

type UnreadCountState = {
  dm: number
  group: number
}

const initialState: UnreadCountState = {dm: 0, group: 0}

export const unreadCountSlice = createSlice({
  name: 'unreadCount',
  initialState,
  reducers: {
    setDMChatCount(state, action: PayloadAction<number>) {
      state.dm = action.payload
    },
    setGroupChatCount(state, action: PayloadAction<number>) {
      state.group = action.payload
    },
    resetUnread(state) {
      state.dm = 0
      state.group = 0
    },
  },
})

export const {setDMChatCount, setGroupChatCount, resetUnread} =
  unreadCountSlice.actions
export default unreadCountSlice.reducer
