// app/store/timeSlice.ts
import {createSlice, PayloadAction} from '@reduxjs/toolkit'

interface TimeState {
  offset: number | null
}

const initialState: TimeState = {
  offset: null,
}

export const timeSlice = createSlice({
  name: 'time',
  initialState,
  reducers: {
    setTimeOffset(state, action: PayloadAction<number>) {
      state.offset = action.payload
    },
  },
})

export const {setTimeOffset} = timeSlice.actions
export default timeSlice.reducer
