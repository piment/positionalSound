// src/reducer/viewModeSlice.js
import { createSlice } from '@reduxjs/toolkit'

export const viewModeSlice = createSlice({
  name: 'viewMode',
  // only two possible values:
  initialState: 'stageMode', 
  reducers: {
    // set it explicitly
    setMode:           (state, action) => action.payload,
    // toggle between the two
    toggleMode:        state => state === 'stageMode'
                                ? 'visualizerMode'
                                : 'stageMode',
  }
})

// export the action creators
export const { setMode, toggleMode } = viewModeSlice.actions
// export the reducer to wire into your store
export default viewModeSlice.reducer
