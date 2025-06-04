import { createSlice } from '@reduxjs/toolkit';

const trackSettingsSlice = createSlice({
  name: 'trackSettings',
  initialState: {
    // trackId: { visible: true, color: '#88ccff' }, …
  },
  reducers: {
    addTrack(state, action) {
      const id = action.payload;
      // when a new track is imported, default it visible + default color
      state[id] = { visible: true, color: '#c4c3c3', volume: 0.8 };
    },
    removeTrack(state, action) {
      delete state[action.payload];
    },
    toggleVisibility(state, action) {
      const id = action.payload;
      if (state[id]) state[id].visible = !state[id].visible;
    },
    setColor(state, action) {
      const { trackId, color } = action.payload;
      if (!state[trackId]) state[trackId] = { visible: true, color };
      else state[trackId].color = color;
    },
    setVolume(state, action) {
      const { trackId, volume } = action.payload;
      if (!state[trackId]) {
        // first time we see this track, give it the default shape
        state[trackId] = {
          visible: true,
          color: '#88ccff',
          volume: volume,
        };
      } else {
        state[trackId].volume = volume;
      }
    },
    setSendLevel(state, action) {
      const { trackId, sendLevel } = action.payload;
      if (!state[trackId]) {
        state[trackId] = {
          visible: true,
          color: '#88ccff',
          volume: 1,
          sendLevel,
        };
      } else {
        state[trackId].sendLevel = sendLevel;
      }
    },
       setPan(state, action) {
      const { trackId, pan } = action.payload;
      if (!state[trackId]) state[trackId] = {};
      state[trackId].pan = pan;
    },
  },
});

export const {
  addTrack,
  removeTrack,
  toggleVisibility,
  setColor,
  setVolume,
  setSendLevel,
  setPan
} = trackSettingsSlice.actions;
export default trackSettingsSlice.reducer;
