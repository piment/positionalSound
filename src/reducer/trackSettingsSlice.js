import { createSlice } from '@reduxjs/toolkit'

const trackSettingsSlice = createSlice({
  name: 'trackSettings',
  initialState: {
    // trackId: { visible: true, color: '#88ccff' }, …
  },
  reducers: {
    addTrack(state, action) {
      const id = action.payload
      // when a new track is imported, default it visible + default color
      state[id] = { visible: true, color: '#88ccff' }
    },
    removeTrack(state, action) {
      delete state[action.payload]
    },
    toggleVisibility(state, action) {
      const id = action.payload
      if (state[id]) state[id].visible = !state[id].visible
    },
    setColor(state, action) {
      const { trackId, color } = action.payload
      if (!state[trackId]) state[trackId] = { visible: true, color }
      else state[trackId].color = color
    },
  },
})

export const {
  addTrack,
  removeTrack,
  toggleVisibility,
  setColor,
} = trackSettingsSlice.actions
export default trackSettingsSlice.reducer
